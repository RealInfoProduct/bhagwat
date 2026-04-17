import { Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTable, MatTableDataSource } from '@angular/material/table';
import { FirebaseService } from 'src/app/services/firebase.service';
import { LoaderService } from 'src/app/services/loader.service';
import { BonusDialogComponent } from './bonus-dialog/bonus-dialog.component';
import { FormBuilder, FormGroup } from '@angular/forms';
import { BonusList } from 'src/app/interface/invoice';
import jsPDF from 'jspdf';

@Component({
  selector: 'app-bonus',
  templateUrl: './bonus.component.html',
  styleUrls: ['./bonus.component.scss']
})
export class BonusComponent implements OnInit {
  dateBonusForm: FormGroup;
  bounsDataColumns: string[] = [
    '#',
    'employee',
    'amount',
    'date',
    'action',
  ];
  bonusList: any = []
  employeeList: any = []

  bonusForm:FormGroup;
   selectedBonuslId: string = '';
  oldBonusData: any = {};

  bonusListDataSource = new MatTableDataSource(this.bonusList);
  @ViewChild(MatTable, { static: true }) table: MatTable<any> = Object.create(null);
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator = Object.create(null);

  constructor(private dialog: MatDialog,
    private firebaseService: FirebaseService,
    private loaderService: LoaderService,
    private _snackBar: MatSnackBar,
    private fb: FormBuilder) { }


  ngOnInit(): void {
    this.bonusFormList()
    const today = new Date();
    const startDate = new Date(today.getFullYear(), today.getMonth(), 1);
    const endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    this.dateBonusForm = this.fb.group({
      start: [startDate],
      end: [endDate]
    });
    this.getBonusList();
    this.getEmployeeList();
  }

  bonusFormList() {
    this.bonusForm = this.fb.group({
       date: [new Date()],
       employee:[''],
       amount:[]
    })
  }

  filterDate() {
    if (!this.bonusList) return;
    const startDate = this.dateBonusForm.value.start ? new Date(this.dateBonusForm.value.start) : null;
    const endDate = this.dateBonusForm.value.end ? new Date(this.dateBonusForm.value.end) : null;
    if (startDate && endDate) {
      this.bonusListDataSource.data = this.bonusList.filter((invoice: any) => {
        if (!invoice.date?.seconds) return false;

        const invoiceDate = new Date(invoice.date.seconds * 1000);

        return invoiceDate >= startDate && invoiceDate <= endDate;
      });
    } else {
      this.bonusListDataSource.data = this.bonusList;
    }
  }

  applyFilter(filterValue: string): void {
    this.bonusListDataSource.filter = filterValue.trim().toLowerCase();
    this.SearchFilter()
  }


  SearchFilter() {
    this.bonusListDataSource.filterPredicate = (data: any, filter: string) => {
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

  // openBonus(action: string, obj: any) {
  //   obj.action = action;

  //   const dialogRef = this.dialog.open(BonusDialogComponent, { data: obj });

  //   dialogRef.afterClosed().subscribe((result) => {
  //     if (result?.event === 'Add') {
  //       const payload: BonusList = {
  //         id: '',
  //         employee: result.data.employee,
  //         amount: result.data.amount,
  //         date: result.data.date,
  //         userId: localStorage.getItem("userId")
  //       }

  //       this.firebaseService.addBonus(payload).then((res) => {
  //         if (res) {
  //           this.getBonusList()
  //           this.openConfigSnackBar('record create successfully')
  //         }
  //       }, (error) => {
  //         console.log("error=>", error);

  //       })
  //     }
  //     if (result?.event === 'Edit') {
  //       this.bonusList.forEach((element: any) => {
  //         if (element.id === result.data.id) {
  //           const payload: BonusList = {
  //             id: result.data.id,
  //             employee: result.data.employee,
  //             amount: result.data.amount,
  //             date: result.data.date,
  //             userId: localStorage.getItem("userId")
  //           }
  //           this.firebaseService.updateBonus(result.data.id, payload).then((res: any) => {
  //             this.getBonusList()
  //             this.openConfigSnackBar('record update successfully')
  //           }, (error) => {
  //             console.log("error => ", error);

  //           })
  //         }
  //       });
  //     }
  //     if (result?.event === 'Delete') {
  //       this.firebaseService.deleteBonus(result.data.id).then((res: any) => {
  //         this.getBonusList()
  //         this.openConfigSnackBar('record delete successfully')
  //       }, (error) => {
  //         console.log("error => ", error);

  //       })
  //     }
  //   });
  // }

  AddBonus(){
    const formValue = this.bonusForm.value;
  
    const isChanged =
      formValue.employee === this.oldBonusData.employee &&
      formValue.amount === this.oldBonusData.amount &&
      new Date(formValue.date).getTime() ===
        new Date(this.oldBonusData.date?.seconds * 1000).getTime();
  
    if (this.selectedBonuslId) {
  
      // 👉 No Change
      if (isChanged) {
        this.openConfigSnackBar('No changes detected');
        return;
      }
  
      // 👉 UPDATE
      const payload: BonusList = {
        id: this.selectedBonuslId,
        employee: formValue.employee,
        amount: formValue.amount,
        date: formValue.date,
        userId: localStorage.getItem("userId")
      };
  
      this.firebaseService.updateBonus(this.selectedBonuslId, payload).then(() => {
        this.getBonusList()
        this.resetBonusForm();
        this.openConfigSnackBar('Record updated successfully');
      });
  
    } else {
  
      // 👉 ADD
      const payload: BonusList = {
        id: '',
        employee: formValue.employee,
        amount: formValue.amount,
        date: formValue.date,
        userId: localStorage.getItem("userId")
      };
  
      this.firebaseService.addBonus(payload).then(() => {
         this.getBonusList()
        this.resetBonusForm();
        this.openConfigSnackBar('Record created successfully');
      });
    }
  }

  EditBonus(obj: any) {

  // 👉 store old data
  this.oldBonusData = { ...obj };

  // 👉 patch form
  this.bonusForm.patchValue({
    employee: obj.employee,
    amount: obj.amount,
    date: obj.date?.seconds
      ? new Date(obj.date.seconds * 1000)
      : new Date()
  });

  this.selectedBonuslId = obj.id;
}

  DeleteBonus(obj: any) {
    this.firebaseService.deleteBonus(obj.id).then((res: any) => {
      this.getBonusList()
      this.openConfigSnackBar('record delete successfully')
    }, (error) => {
      console.log("error => ", error);

    })
  }

  
  resetBonusForm() {
  this.bonusForm.reset();

  this.bonusForm.patchValue({
    date: new Date()
  });

  this.selectedBonuslId = '';
  this.oldBonusData = {};
}

  getBonusList() {
    this.loaderService.setLoader(true)
    this.firebaseService.getAllBonus().subscribe((res: any) => {
      if (res) {
        this.bonusList = res.filter((id: any) => id.userId === localStorage.getItem("userId"))
        this.bonusListDataSource = new MatTableDataSource(this.bonusList);
        this.bonusListDataSource.paginator = this.paginator;
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

        this.getBonusList();
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
  if (!this.bonusListDataSource || this.bonusListDataSource.data.length === 0) {
    this.openConfigSnackBar('No bonus data available to generate PDF.');
    return;
  }

  const doc = new jsPDF();

  // Get date range from form
  const startDate = new Date(this.dateBonusForm.value.start);
  const endDate = new Date(this.dateBonusForm.value.end);

  const formattedStart = startDate.toLocaleDateString('en-GB');
  const formattedEnd = endDate.toLocaleDateString('en-GB');

  // PDF Title
  doc.setFontSize(12);
  doc.text(`Bonus Report: ${formattedStart} - ${formattedEnd}`, 14, 15);

  // Total bonus amount
  const totalAmount = this.bonusListDataSource.data.reduce(
    (sum: number, b: any) => sum + parseFloat(b.amount || 0),
    0
  );
  const formattedAmount = totalAmount.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  doc.text(`Total Bonus Amount: ${formattedAmount}`, 131, 15);

  // Table headers
  const headers = ['S.No', 'Employee Name', 'Amount', 'Date'];

  // Table data
  const data = this.bonusListDataSource.data.map((b: any, index: number) => {
    const emp = this.employeeList.find((e:any) => e.id === b.employee);
    const employeeName = emp ? `${emp.firstName} ${emp.lastName}` : '';
    const date = b.date?.seconds ? new Date(b.date.seconds * 1000).toLocaleDateString('en-GB') : '';
    return [index + 1, employeeName, b.amount, date];
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
  doc.save(`Bonus_Report_${formattedStart.replace(/\//g, '-')}_to_${formattedEnd.replace(/\//g, '-')}.pdf`);
}
}
