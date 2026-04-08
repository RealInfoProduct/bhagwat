import { Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTable, MatTableDataSource } from '@angular/material/table';
import { Timestamp } from 'firebase/firestore';
import { FirebaseService } from 'src/app/services/firebase.service';
import { LoaderService } from 'src/app/services/loader.service';
import { ExpensesDialogComponent } from './expenses-dialog/expenses-dialog.component';
import { ExpensesList } from 'src/app/interface/invoice';
import { FormBuilder, FormGroup } from '@angular/forms';
import jsPDF from 'jspdf';

@Component({
  selector: 'app-expenses',
  templateUrl: './expenses.component.html',
  styleUrls: ['./expenses.component.scss']
})
export class ExpensesComponent implements OnInit {

  expensesDataColumns: string[] = ['#', 'expenses', 'creditDate', 'description', 'amount', 'action'];
  expensesList: any = [];
  expensesmasterList: any = [];
  dateExpensesListForm: FormGroup;

  expensesListDataSource = new MatTableDataSource(this.expensesList);
  @ViewChild(MatTable, { static: true }) table: MatTable<any> = Object.create(null);
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator = Object.create(null);

  constructor(
    private fb: FormBuilder,
    private dialog: MatDialog,
    private firebaseService: FirebaseService,
    private _snackBar: MatSnackBar,
    private loaderService: LoaderService
  ) { }

  ngOnInit(): void {
    const today = new Date();
    const startDate = new Date(today.getFullYear(), today.getMonth(), 1);
    const endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    this.dateExpensesListForm = this.fb.group({
      start: [startDate],
      end: [endDate]
    });
    this.getExpensesList()
    this.getExpensesmasterList()
  }

  filterDate() {
    if (!this.expensesList) return;

    const startDate = this.dateExpensesListForm.value.start;
    const endDate = this.dateExpensesListForm.value.end;

    if (startDate && endDate) {
      // Convert to timestamps
      const startTime = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate()).getTime();
      // End time set to 23:59:59.999
      const endTime = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), 23, 59, 59, 999).getTime();

      this.expensesListDataSource.data = this.expensesList.filter((invoice: any) => {
        if (!invoice.creditDate?.seconds) return false;
        const invoiceTime = invoice.creditDate.seconds * 1000; // Firestore timestamp to ms
        return invoiceTime >= startTime && invoiceTime <= endTime;
      });
    } else {
      this.expensesListDataSource.data = this.expensesList;
    }
  }

  ngAfterViewInit() {
    this.expensesListDataSource.paginator = this.paginator;
  }

  applyFilter(filterValue: string): void {
    this.expensesListDataSource.filter = filterValue.trim().toLowerCase();
  }

  convertTimestampToDate(element: any): Date | null {
    if (element instanceof Timestamp) {
      return element.toDate();
    }
    return null;
  }


  openExpenses(action: string, obj: any) {
    const dialogRef = this.dialog.open(ExpensesDialogComponent, {
      data: { ...obj, action },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result?.event === 'Add') {
        const products = result.data.products; // ✅ array
        products.forEach((p: any) => {
          const payload: ExpensesList = {
            id: '',
            expensesname: p.expensesname,   // ✅ each product
            description: p.description,
            amount: p.amount,
            creditDate: result.data.creditDate, // ✅ SAME DATE
            userId: localStorage.getItem("userId")
          };

          this.firebaseService.addExpenses(payload).then((res: any) => {
            this.getExpensesList();
            this.openConfigSnackBar('All records created successfully');
          }, (error) => {
            console.log("error => ", error);
          });

        });

      }
      if (result?.event === 'Edit') {
        debugger
        const products = result.data.products; // ✅ array

        products.forEach((p: any) => {
          const payload: ExpensesList = {
            id: result.data.id,
            expensesname: p.expensesname,
            description: p.description,
            amount: p.amount,
            creditDate: result.data.creditDate,
            userId: localStorage.getItem("userId")
          }
          this.firebaseService.updateExpenses(result.data.id, payload).then((res: any) => {
            this.getExpensesList()
            this.openConfigSnackBar('record update successfully')
          }, (error) => {
            console.log("error => ", error);
          });
        })
      }
      if (result?.event === 'Delete') {
        this.firebaseService.deleteExpenses(result.data.id).then((res: any) => {
          this.getExpensesList()
          this.openConfigSnackBar('record delete successfully')
        }, (error) => {
          console.log("error => ", error);

        })
      }
    });
  }

  getExpensesList() {
    this.loaderService.setLoader(true)
    this.firebaseService.getAllExpenses().subscribe((res: any) => {
      if (res) {
        this.expensesList = res.filter((id: any) => id.userId === localStorage.getItem("userId"))
        this.expensesListDataSource = new MatTableDataSource(this.expensesList);
        this.expensesListDataSource.paginator = this.paginator;
        this.filterDate()
        this.loaderService.setLoader(false)
      }
    })
  }

  getExpensesmasterList() {
    this.loaderService.setLoader(true)
    this.firebaseService.getAllExpensesmaster().subscribe((res: any) => {
      if (res) {
        this.loaderService.setLoader(false)
      }
    })
  }

  openConfigSnackBar(snackbarTitle: any) {
    this._snackBar.open(snackbarTitle, 'Splash', {
      duration: 2 * 1000,
      horizontalPosition: 'right',
      verticalPosition: 'top',
    });
  }

  filedownload() {
  if (!this.expensesListDataSource.data || this.expensesListDataSource.data.length === 0) {
    this.openConfigSnackBar('No expenses data available to generate PDF.');
    return;
  }

  const doc = new jsPDF();

  const startDate = this.dateExpensesListForm.value.start;
  const endDate = this.dateExpensesListForm.value.end;

  const formattedStart = startDate
    ? new Date(startDate).toLocaleDateString('en-GB')
    : '';
  const formattedEnd = endDate
    ? new Date(endDate).toLocaleDateString('en-GB')
    : '';

  // Title
  doc.setFontSize(12);
  doc.text(`Expenses Report: ${formattedStart} - ${formattedEnd}`, 14, 15);

  // Total Amount
  const totalAmount = this.expensesListDataSource.data.reduce(
    (sum: number, item: any) => sum + Number(item.amount || 0),
    0
  );

  const formattedAmount = totalAmount.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  doc.text(`Total Amount: ${formattedAmount}`, 140, 15);

  // Table headers
  const headers = [
    '#',
    'Expenses Type',
    'Date',
    'Description',
    'Amount'
  ];

  // Table data
  const data = this.expensesListDataSource.data.map((item: any, index: number) => {
    return [
      index + 1,
      item.expensesname,
      item.creditDate?.seconds
        ? new Date(item.creditDate.seconds * 1000).toLocaleDateString('en-GB')
        : '',
      item.description || '',
      item.amount
    ];
  });

  // Table
  (doc as any).autoTable({
    head: [headers],
    body: data,
    startY: 25,
    theme: 'grid',
    headStyles: {
      fillColor: [255, 187, 0],
      textColor: [0, 0, 0],
      fontStyle: 'bold'
    },
    styles: {
      fontSize: 9,
      halign: 'center',
      valign: 'middle'
    }
  });

  // Save
  doc.save(
    `Expenses_Report_${formattedStart.replace(/\//g, '-')}_to_${formattedEnd.replace(/\//g, '-')}.pdf`
  );
}


}

