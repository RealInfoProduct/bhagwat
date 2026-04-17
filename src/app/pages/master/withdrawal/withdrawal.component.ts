import { Component, OnInit, ViewChild } from '@angular/core';
import { MatTable, MatTableDataSource } from '@angular/material/table';
import { WithdrawalDialogComponent } from './withdrawal-dialog/withdrawal-dialog.component';
import { MatPaginator } from '@angular/material/paginator';
import { FirebaseService } from 'src/app/services/firebase.service';
import { MatDialog } from '@angular/material/dialog';
import { LoaderService } from 'src/app/services/loader.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FormBuilder, FormGroup } from '@angular/forms';
import { WithdrawalList } from 'src/app/interface/invoice';
import jsPDF from 'jspdf';

@Component({
  selector: 'app-withdrawal',
  templateUrl: './withdrawal.component.html',
  styleUrls: ['./withdrawal.component.scss']
})
export class WithdrawalComponent implements OnInit {
  dateWithdrawalForm: FormGroup;
  withdrawalDataColumns: string[] = [
    '#',
    'employee',
    'amount',
    'date',
    'action',
  ];
  WithdrawalList: any = []
  employeeList: any = []

  withdrawalForm: FormGroup;
  selectedWithdrawalId: string = '';
  oldWithdrawalData: any = {};

  WithdrawalListDataSource = new MatTableDataSource(this.WithdrawalList);
  @ViewChild(MatTable, { static: true }) table: MatTable<any> = Object.create(null);
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator = Object.create(null);

  constructor(private dialog: MatDialog,
    private firebaseService: FirebaseService,
    private loaderService: LoaderService,
    private _snackBar: MatSnackBar,
    private fb: FormBuilder) { }


  ngOnInit(): void {
    this.buildForm() 
    const today = new Date();
    const startDate = new Date(today.getFullYear(), today.getMonth(), 1);
    const endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    this.dateWithdrawalForm = this.fb.group({
      start: [startDate],
      end: [endDate]
    });
    this.getWithdrawalList();
    this.getEmployeeList();
  }

  
  buildForm() {
    this.withdrawalForm = this.fb.group({
       date: [new Date()],
       employee:[''],
       amount:[]
    })
  }


  filterDate() {
    if (!this.WithdrawalList) return;
    const startDate = this.dateWithdrawalForm.value.start ? new Date(this.dateWithdrawalForm.value.start) : null;
    const endDate = this.dateWithdrawalForm.value.end ? new Date(this.dateWithdrawalForm.value.end) : null;
    if (startDate && endDate) {
      this.WithdrawalListDataSource.data = this.WithdrawalList.filter((invoice: any) => {
        if (!invoice.date?.seconds) return false;

        const invoiceDate = new Date(invoice.date.seconds * 1000);

        return invoiceDate >= startDate && invoiceDate <= endDate;
      });
    } else {
      this.WithdrawalListDataSource.data = this.WithdrawalList;
    }
  }

  applyFilter(filterValue: string): void {
    this.WithdrawalListDataSource.filter = filterValue.trim().toLowerCase();
    this.SearchFilter()
  }

  SearchFilter() {
    this.WithdrawalListDataSource.filterPredicate = (data: any, filter: string) => {
      const searchText = filter.trim().toLowerCase();
      const amount = data.amount?.toString().toLowerCase() || '';

      const EmployeeName =
        this.employeeList.find((p: any) => p.id === data.employee)?.firstName
          ?.toLowerCase() || '';

      return (
        amount.includes(searchText) ||
        EmployeeName.includes(searchText)
      );
    };
  }



  // openwithdrawal(action: string, obj: any) {
  //   obj.action = action;

  //   const dialogRef = this.dialog.open(WithdrawalDialogComponent, { data: obj });

  //   dialogRef.afterClosed().subscribe((result) => {
  //     if (result?.event === 'Add') {
  //       const payload: WithdrawalList = {
  //         id: '',
  //         employee: result.data.employee,
  //         amount: result.data.amount,
  //         date: result.data.date,
  //         userId: localStorage.getItem("userId")
  //       }

  //       this.firebaseService.addWithdrawal(payload).then((res) => {
  //         if (res) {
  //           this.getWithdrawalList()
  //           this.openConfigSnackBar('record create successfully')
  //         }
  //       }, (error) => {
  //         console.log("error=>", error);

  //       })
  //     }
  //     if (result?.event === 'Edit') {
  //       this.WithdrawalList.forEach((element: any) => {
  //         if (element.id === result.data.id) {
  //           const payload: WithdrawalList = {
  //             id: result.data.id,
  //             employee: result.data.employee,
  //             amount: result.data.amount,
  //             date: result.data.date,
  //             userId: localStorage.getItem("userId")
  //           }
  //           this.firebaseService.updateWithdrawal(result.data.id, payload).then((res: any) => {
  //             this.getWithdrawalList()
  //             this.openConfigSnackBar('record update successfully')
  //           }, (error) => {
  //             console.log("error => ", error);

  //           })
  //         }
  //       });
  //     }
  //     if (result?.event === 'Delete') {
  //       this.firebaseService.deleteWithdrawal(result.data.id).then((res: any) => {
  //         this.getWithdrawalList()
  //         this.openConfigSnackBar('record delete successfully')
  //       }, (error) => {
  //         console.log("error => ", error);

  //       })
  //     }
  //   });
  // }

 Addwithdrawal() {
  const formValue = this.withdrawalForm.value;

  const isChanged =
    formValue.employee === this.oldWithdrawalData.employee &&
    formValue.amount === this.oldWithdrawalData.amount &&
    new Date(formValue.date).getTime() ===
      new Date(this.oldWithdrawalData.date?.seconds * 1000).getTime();

  if (this.selectedWithdrawalId) {

    // 👉 No Change
    if (isChanged) {
      this.openConfigSnackBar('No changes detected');
      return;
    }

    // 👉 UPDATE
    const payload: WithdrawalList = {
      id: this.selectedWithdrawalId,
      employee: formValue.employee,
      amount: formValue.amount,
      date: formValue.date,
      userId: localStorage.getItem("userId")
    };

    this.firebaseService.updateWithdrawal(this.selectedWithdrawalId, payload).then(() => {
      this.getWithdrawalList();
      this.resetWithdrawalForm();
      this.openConfigSnackBar('Record updated successfully');
    });

  } else {

    // 👉 ADD
    const payload: WithdrawalList = {
      id: '',
      employee: formValue.employee,
      amount: formValue.amount,
      date: formValue.date,
      userId: localStorage.getItem("userId")
    };

    this.firebaseService.addWithdrawal(payload).then(() => {
      this.getWithdrawalList();
      this.resetWithdrawalForm();
      this.openConfigSnackBar('Record created successfully');
    });
  }
}

 Editwithdrawal(obj: any) {

  // 👉 store old data
  this.oldWithdrawalData = { ...obj };

  // 👉 patch form
  this.withdrawalForm.patchValue({
    employee: obj.employee,
    amount: obj.amount,
    date: obj.date?.seconds
      ? new Date(obj.date.seconds * 1000)
      : new Date()
  });

  this.selectedWithdrawalId = obj.id;
}

  Deletewithdrawal(obj:any){
      this.firebaseService.deleteWithdrawal(obj.id).then((res: any) => {
          this.getWithdrawalList()
          this.openConfigSnackBar('record delete successfully')
        }, (error) => {
          console.log("error => ", error);

        })
  }

  resetWithdrawalForm() {
  this.withdrawalForm.reset();

  this.withdrawalForm.patchValue({
    date: new Date()
  });

  this.selectedWithdrawalId = '';
  this.oldWithdrawalData = {};
}

  getWithdrawalList() {
    this.loaderService.setLoader(true)
    this.firebaseService.getAllWithdrawal().subscribe((res: any) => {
      if (res) {
        this.WithdrawalList = res.filter((id: any) => id.userId === localStorage.getItem("userId"))
        this.WithdrawalListDataSource = new MatTableDataSource(this.WithdrawalList);
        this.WithdrawalListDataSource.paginator = this.paginator;
        this.filterDate()
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


  getEmployeeList() {
    this.loaderService.setLoader(true);

    this.firebaseService.getAllEmployee().subscribe((res: any) => {
      if (res) {
        this.employeeList = res.filter(
          (item: any) => item.userId === localStorage.getItem("userId")
        );
        this.loaderService.setLoader(false);

        this.getWithdrawalList();
      }
    });
  }

  getemployeeid(nameid: any) {
    return this.employeeList.find((id: any) => id.id === nameid)?.firstName
  }
  getemployeelastid(nameid: any) {
    return this.employeeList.find((id: any) => id.id === nameid)?.lastName
  }

 filedownload() {
  if (!this.WithdrawalListDataSource || this.WithdrawalListDataSource.data.length === 0) {
    this.openConfigSnackBar('No withdrawal data available to generate PDF.');
    return;
  }

  const doc = new jsPDF();

  // Get date range from form
  const startDate = new Date(this.dateWithdrawalForm.value.start);
  const endDate = new Date(this.dateWithdrawalForm.value.end);

  const formattedStart = startDate.toLocaleDateString('en-GB');
  const formattedEnd = endDate.toLocaleDateString('en-GB');

  // PDF Title
  doc.setFontSize(12);
  doc.text(`Withdrawal Report: ${formattedStart} - ${formattedEnd}`, 14, 15);

  // Total amount
  const totalAmount = this.WithdrawalListDataSource.data.reduce(
    (sum: number, w: any) => sum + parseFloat(w.amount || 0),
    0
  );
  const formattedAmount = totalAmount.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  doc.text(`Total Withdrawal Amount: ${formattedAmount}`, 131, 15);

  // Table headers
  const headers = ['S.No', 'Employee Name', 'Amount', 'Date'];

  // Table data
  const data = this.WithdrawalListDataSource.data.map((w: any, index: number) => {
    const emp = this.employeeList.find((e:any) => e.id === w.employee);
    const employeeName = emp ? `${emp.firstName} ${emp.lastName}` : '';
    const date = w.date?.seconds ? new Date(w.date.seconds * 1000).toLocaleDateString('en-GB') : '';
    return [index + 1, employeeName, w.amount, date];
  });

  // Generate table
  (doc as any).autoTable({
    head: [headers],
    body: data,
    startY: 25,
    theme: 'grid',
    headStyles: { fillColor: [255, 187, 0], textColor: [0, 0, 0], fontStyle: 'bold' },
    styles: { fontSize: 10, halign: 'center', valign: 'middle' }
  });

  // Save PDF
  doc.save(`Withdrawal_Report_${formattedStart.replace(/\//g, '-')}_to_${formattedEnd.replace(/\//g, '-')}.pdf`);
}

}
