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

@Component({
  selector: 'app-withdrawal',
  templateUrl: './withdrawal.component.html',
  styleUrls: ['./withdrawal.component.scss']
})
export class WithdrawalComponent implements OnInit{
 dateWithdrawalForm: FormGroup;
  withdrawalDataColumns: string[] = [
    '#',
    'employee',
    'amount',
    'date',
    'action',
  ];
  WithdrawalList :any = []
  employeeList :any = []
  WithdrawalListDataSource = new MatTableDataSource(this.WithdrawalList);
  @ViewChild(MatTable, { static: true }) table: MatTable<any> = Object.create(null);
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator = Object.create(null);

  constructor(private dialog: MatDialog , 
    private firebaseService : FirebaseService ,
    private loaderService : LoaderService,
    private _snackBar: MatSnackBar,
   private fb: FormBuilder) { }


  ngOnInit(): void {
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
  }

  
  openwithdrawal(action: string, obj: any) {
    obj.action = action;

    const dialogRef = this.dialog.open(WithdrawalDialogComponent, { data: obj });

    dialogRef.afterClosed().subscribe((result) => {
      if (result?.event === 'Add') {
        const payload: WithdrawalList = {
          id: '',
          employee: result.data.employee,
          amount: result.data.amount,
          date: result.data.date,
          userId : localStorage.getItem("userId")
        }

        this.firebaseService.addWithdrawal(payload).then((res) => {
          if (res) {
              this.getWithdrawalList()
              this.openConfigSnackBar('record create successfully')
            }
        } , (error) => {
          console.log("error=>" , error);
          
        })
      }
      if (result?.event === 'Edit') {
        this.WithdrawalList.forEach((element: any) => {
          if (element.id === result.data.id) {
            const payload: WithdrawalList = {
              id: result.data.id,
              employee: result.data.employee,
              amount: result.data.amount,
              date: result.data.date,
              userId: localStorage.getItem("userId")
            }
              this.firebaseService.updateWithdrawal(result.data.id , payload).then((res:any) => {
                  this.getWithdrawalList()
                  this.openConfigSnackBar('record update successfully')
              }, (error) => {
                console.log("error => " , error);
                
              })
          }
        });
      }
      if (result?.event === 'Delete') {
        this.firebaseService.deleteWithdrawal(result.data.id).then((res:any) => {
            this.getWithdrawalList()
            this.openConfigSnackBar('record delete successfully')
        }, (error) => {
          console.log("error => " , error);
          
        })
      }
    });
  }

  getWithdrawalList() {
    this.loaderService.setLoader(true)
    this.firebaseService.getAllWithdrawal().subscribe((res: any) => {
      if (res) {
        this.WithdrawalList = res.filter((id:any) => id.userId === localStorage.getItem("userId"))
        this.WithdrawalListDataSource = new MatTableDataSource(this.WithdrawalList);
        this.WithdrawalListDataSource.paginator = this.paginator;
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

}
