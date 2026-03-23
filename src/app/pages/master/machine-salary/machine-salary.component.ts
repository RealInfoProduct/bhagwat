import { Component, OnInit, ViewChild } from '@angular/core';
import { FormGroup, FormBuilder } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource, MatTable } from '@angular/material/table';
import { MachineSalaryList} from 'src/app/interface/invoice';
import { FirebaseService } from 'src/app/services/firebase.service';
import { LoaderService } from 'src/app/services/loader.service';
import { MachineSalaryDialogComponent } from './machine-salary-dialog/machine-salary-dialog.component';

@Component({
  selector: 'app-machine-salary',
  templateUrl: './machine-salary.component.html',
  styleUrls: ['./machine-salary.component.scss']
})
export class MachineSalaryComponent implements OnInit{
 machinesalaryForm: FormGroup;
  machineSalaryDataColumns: string[] = [
    '#',
    'employee',
    'amount',
    'date',
    'action',
  ];
  machineSalaryList :any = []
  employeeList :any = []
  machineSalaryListDataSource = new MatTableDataSource(this.machineSalaryList);
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
    this.machinesalaryForm = this.fb.group({
      start: [startDate],
      end: [endDate]
    });
  this.getmachineSalaryList();
  this.getEmployeeList();
  }

   filterDate() {
    if (!this.machineSalaryList) return;
    const startDate = this.machinesalaryForm.value.start ? new Date(this.machinesalaryForm.value.start) : null;
    const endDate = this.machinesalaryForm.value.end ? new Date(this.machinesalaryForm.value.end) : null;
    if (startDate && endDate) {
      this.machineSalaryListDataSource.data = this.machineSalaryList.filter((invoice: any) => {
        if (!invoice.date?.seconds) return false;

        const invoiceDate = new Date(invoice.date.seconds * 1000);

        return invoiceDate >= startDate && invoiceDate <= endDate;
      });
    } else {
      this.machineSalaryListDataSource.data = this.machineSalaryList;
    }
  }

  applyFilter(filterValue: string): void {
    this.machineSalaryListDataSource.filter = filterValue.trim().toLowerCase();
  }

  
  openMachineSalary(action: string, obj: any) {
    obj.action = action;

    const dialogRef = this.dialog.open(MachineSalaryDialogComponent, { data: obj });

    dialogRef.afterClosed().subscribe((result) => {
      if (result?.event === 'Add') {
        const payload: MachineSalaryList = {
          id: '',
          employee: result.data.employee,
          amount: result.data.amount,
          date: result.data.date,
          userId : localStorage.getItem("userId")
        }

        this.firebaseService.addMachineSalary(payload).then((res) => {
          if (res) {
              this.getmachineSalaryList()
              this.openConfigSnackBar('record create successfully')
            }
        } , (error) => {
          console.log("error=>" , error);
          
        })
      }
      if (result?.event === 'Edit') {
        this.machineSalaryList.forEach((element: any) => {
          if (element.id === result.data.id) {
            const payload: MachineSalaryList = {
              id: result.data.id,
              employee: result.data.employee,
              amount: result.data.amount,
              date: result.data.date,
              userId: localStorage.getItem("userId")
            }
              this.firebaseService.updateMachineSalary(result.data.id , payload).then((res:any) => {
                  this.getmachineSalaryList()
                  this.openConfigSnackBar('record update successfully')
              }, (error) => {
                console.log("error => " , error);
                
              })
          }
        });
      }
      if (result?.event === 'Delete') {
        this.firebaseService.deleteMachineSalary(result.data.id).then((res:any) => {
            this.getmachineSalaryList()
            this.openConfigSnackBar('record delete successfully')
        }, (error) => {
          console.log("error => " , error);
          
        })
      }
    });
  }

  getmachineSalaryList() {
    this.loaderService.setLoader(true)
    this.firebaseService.getAllMachineSalary().subscribe((res: any) => {
      if (res) {
        this.machineSalaryList = res.filter((id:any) => id.userId === localStorage.getItem("userId"))
        this.machineSalaryListDataSource = new MatTableDataSource(this.machineSalaryList);
        this.machineSalaryListDataSource.paginator = this.paginator;
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

      this.getmachineSalaryList();
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
