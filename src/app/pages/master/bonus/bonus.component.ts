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

@Component({
  selector: 'app-bonus',
  templateUrl: './bonus.component.html',
  styleUrls: ['./bonus.component.scss']
})
export class BonusComponent implements OnInit{
 dateBonusForm: FormGroup;
  bounsDataColumns: string[] = [
    '#',
    'employee',
    'amount',
    'date',
    'action',
  ];
  bonusList :any = []
  employeeList :any = []
  bonusListDataSource = new MatTableDataSource(this.bonusList);
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
    this.dateBonusForm = this.fb.group({
      start: [startDate],
      end: [endDate]
    });
  this.getBonusList();
  this.getEmployeeList();
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
  }

  
  openBonus(action: string, obj: any) {
    obj.action = action;

    const dialogRef = this.dialog.open(BonusDialogComponent, { data: obj });

    dialogRef.afterClosed().subscribe((result) => {
      if (result?.event === 'Add') {
        const payload: BonusList = {
          id: '',
          employee: result.data.employee,
          amount: result.data.amount,
          date: result.data.date,
          userId : localStorage.getItem("userId")
        }

        this.firebaseService.addBonus(payload).then((res) => {
          if (res) {
              this.getBonusList()
              this.openConfigSnackBar('record create successfully')
            }
        } , (error) => {
          console.log("error=>" , error);
          
        })
      }
      if (result?.event === 'Edit') {
        this.bonusList.forEach((element: any) => {
          if (element.id === result.data.id) {
            const payload: BonusList = {
              id: result.data.id,
              employee: result.data.employee,
              amount: result.data.amount,
              date: result.data.date,
              userId: localStorage.getItem("userId")
            }
              this.firebaseService.updateBonus(result.data.id , payload).then((res:any) => {
                  this.getBonusList()
                  this.openConfigSnackBar('record update successfully')
              }, (error) => {
                console.log("error => " , error);
                
              })
          }
        });
      }
      if (result?.event === 'Delete') {
        this.firebaseService.deleteBonus(result.data.id).then((res:any) => {
            this.getBonusList()
            this.openConfigSnackBar('record delete successfully')
        }, (error) => {
          console.log("error => " , error);
          
        })
      }
    });
  }

  getBonusList() {
    this.loaderService.setLoader(true)
    this.firebaseService.getAllBonus().subscribe((res: any) => {
      if (res) {
        this.bonusList = res.filter((id:any) => id.userId === localStorage.getItem("userId"))
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

}
