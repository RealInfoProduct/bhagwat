import { Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTable, MatTableDataSource } from '@angular/material/table';
import { FirebaseService } from 'src/app/services/firebase.service';
import { LoaderService } from 'src/app/services/loader.service';
import { BrokerDialogComponent } from './broker-dialog/broker-dialog.component';
import { BrokerList } from 'src/app/interface/invoice';

@Component({
  selector: 'app-broker',
  templateUrl: './broker.component.html',
  styleUrls: ['./broker.component.scss']
})
export class BrokerComponent implements OnInit {
  displayedColumns: string[] = [
    '#',
    'header',
    'Subheader',
    'GSTMo',
    'MobileNo',
    'PersonalMobileNo',
    'BankName',
    'BankAccountNo',
    'accountholdersname',
    'Address',
    'action',
  ];

  brokerList: any = []
  brokerDataSource = new MatTableDataSource(this.brokerList);
  @ViewChild(MatTable, { static: true }) table: MatTable<any> = Object.create(null);
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator = Object.create(null);

  constructor(private dialog: MatDialog,
    private firebaseService: FirebaseService,
    private loaderService: LoaderService,
    private _snackBar: MatSnackBar,) { }

  ngOnInit(): void {
    this.getBrokerList()
  }

  applyFilter(filterValue: string): void {
    this.brokerDataSource.filter = filterValue.trim().toLowerCase();
  }


  getBrokerList() {
    this.loaderService.setLoader(true)
    this.firebaseService.getAllBroker().subscribe((res: any) => {
      if (res) {
        this.brokerList = res.filter((id: any) => id.userId === localStorage.getItem("userId"))
        this.brokerDataSource = new MatTableDataSource(this.brokerList);
        this.brokerDataSource.paginator = this.paginator;
        this.loaderService.setLoader(false)
      }
    })
  }

  addBroker(action: string, obj: any) {
    obj.action = action;
    const dialogRef = this.dialog.open(BrokerDialogComponent, {
      data: obj,
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result?.event === 'Add') {
        const payload: BrokerList = {
          id: '',
          header: result.data.header,
          subHeader: result.data.subHeader,
          address: result.data.address,
          gstNo: result.data.GSTNo,
          panNo: result.data.panNo,
          mobileNo: Number(result.data.mobileNo),
          personalMobileNo: result.data.personalMobileNo,
          bankName: result.data.bankName,
          accountholdersname: result.data.accountholdersname,
          bankIfsc: result.data.ifscCode,
          bankAccountNo: result.data.bankAccountNo,
          userId: localStorage.getItem("userId"),
        }
        this.firebaseService.addBroker(payload).then((res) => {
          if (res) {
            this.getBrokerList()
            this.openConfigSnackBar('record create successfully')
          }
        }, (error) => {
          console.log("error=>", error);

        })
      }
      if (result?.event === 'Edit') {
        this.brokerList.forEach((element: any) => {
          if (element.id === result.data.id) {
            const payload: BrokerList = {
              id: result.data.id,
              header: result.data.header,
              subHeader: result.data.subHeader,
              address: result.data.address,
              gstNo: result.data.GSTNo,
              panNo: result.data.panNo,
              mobileNo: Number(result.data.mobileNo),
              personalMobileNo: result.data.personalMobileNo,
              bankName: result.data.bankName,
              accountholdersname: result.data.accountholdersname,
              bankIfsc: result.data.ifscCode,
              bankAccountNo: result.data.bankAccountNo,
              userId: localStorage.getItem("userId"),
            }
            this.firebaseService.updateBroker(result.data.id, payload).then((res: any) => {
              this.getBrokerList()
              this.openConfigSnackBar('record update successfully')
            }, (error) => {
              console.log("error => ", error);

            })
          }
        });
      }
      if (result?.event === 'Delete') {
        this.firebaseService.deleteBroker(result.data.id).then((res: any) => {
          this.getBrokerList()
          this.openConfigSnackBar('record delete successfully')
        }, (error) => {
          console.log("error => ", error);

        })
      }
    });
  }


  openConfigSnackBar(snackbarTitle: any) {
    this._snackBar.open(snackbarTitle, 'Splash', {
      duration: 2 * 1000,
      horizontalPosition: 'right',
      verticalPosition: 'top',
    });
  }
}
