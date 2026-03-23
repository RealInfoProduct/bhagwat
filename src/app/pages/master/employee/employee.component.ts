import { Component, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTable, MatTableDataSource } from '@angular/material/table';
import { EmployeeList } from 'src/app/interface/invoice';
import { FirebaseService } from 'src/app/services/firebase.service';
import { LoaderService } from 'src/app/services/loader.service';
import { EmployeeDialogComponent } from './employee-dialog/employee-dialog.component';

@Component({
  selector: 'app-employee',
  templateUrl: './employee.component.html',
  styleUrls: ['./employee.component.scss']
})
export class EmployeeComponent  {

  displayedColumns: string[] = [
    'srno',
    'FirstName',
    'lastName',
    'salary',
    'phoneNo',
    'bankName',
    'bankIFSC',
    'bankAccountNo',
    'action',
  ];
  employeeList :any = []
  employeeDataSource = new MatTableDataSource(this.employeeList);
  @ViewChild(MatTable, { static: true }) table: MatTable<any> = Object.create(null);
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator = Object.create(null);

  constructor(private dialog: MatDialog , 
    private firebaseService : FirebaseService ,
    private loaderService : LoaderService,
    private _snackBar: MatSnackBar,) { }


  ngOnInit(): void {
  this.getEmployeeList()
  }

  applyFilter(filterValue: string): void {
    this.employeeDataSource.filter = filterValue.trim().toLowerCase();
  }
  
 
  addEmployee(action: string, obj: any) {
    obj.action = action;

    const dialogRef = this.dialog.open(EmployeeDialogComponent, { data: obj });

    dialogRef.afterClosed().subscribe((result) => {
      if (result?.event === 'Add') {
        const payload: EmployeeList = {
          id: '',
          firstName: result.data.firstName,
          lastName: result.data.lastName,
          salary: result.data.salary,
          phoneNo: result.data.phoneNo,
          bankName: result.data.bankName,
          bankIFSC: result.data.bankIFSC,
          bankAccountNo: result.data.bankAccountNo,
          userId : localStorage.getItem("userId")
        }

        this.firebaseService.addEmployee(payload).then((res) => {
          if (res) {
              this.getEmployeeList()
              this.openConfigSnackBar('record create successfully')
            }
        } , (error) => {
          console.log("error=>" , error);
          
        })
      }
      if (result?.event === 'Edit') {
        this.employeeList.forEach((element: any) => {
          if (element.id === result.data.id) {
            const payload: EmployeeList = {
              id: result.data.id,
              firstName: result.data.firstName,
              lastName: result.data.lastName,
              salary: result.data.salary,
              phoneNo: result.data.phoneNo,
              bankName: result.data.bankName,
              bankIFSC: result.data.bankIFSC,
              bankAccountNo: result.data.bankAccountNo,
              userId: localStorage.getItem("userId")
            }
              this.firebaseService.updateEmployee(result.data.id , payload).then((res:any) => {
                  this.getEmployeeList()
                  this.openConfigSnackBar('record update successfully')
              }, (error) => {
                console.log("error => " , error);
                
              })
          }
        });
      }
      if (result?.event === 'Delete') {
        this.firebaseService.deleteEmployee(result.data.id).then((res:any) => {
            this.getEmployeeList()
            this.openConfigSnackBar('record delete successfully')
        }, (error) => {
          console.log("error => " , error);
          
        })
      }
    });
  }

  getEmployeeList() {
    this.loaderService.setLoader(true)
    this.firebaseService.getAllEmployee().subscribe((res: any) => {
      if (res) {
        this.employeeList = res.filter((id:any) => id.userId === localStorage.getItem("userId"))
        this.employeeDataSource = new MatTableDataSource(this.employeeList);
        this.employeeDataSource.paginator = this.paginator;
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

}
