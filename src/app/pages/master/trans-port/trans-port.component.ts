import { Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource, MatTable } from '@angular/material/table';
import { FirebaseService } from 'src/app/services/firebase.service';
import { LoaderService } from 'src/app/services/loader.service';
import { TransPortDialogComponent } from './trans-port-dialog/trans-port-dialog.component';
import { TransPortList } from 'src/app/interface/invoice';

@Component({
  selector: 'app-trans-port',
  templateUrl: './trans-port.component.html',
  styleUrls: ['./trans-port.component.scss']
})
export class TransPortComponent implements OnInit {
  displayedColumns: string[] = [
    '#',
    'transPortCompany',
    'header',
    'Subheader',
    'Address',
    'MobileNo',
    'transPortId',
    'action',
  ];

  transPortList: any[] = []

  transPortDataSource = new MatTableDataSource(this.transPortList);
  @ViewChild(MatTable, { static: true }) table: MatTable<any> = Object.create(null);
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator = Object.create(null);

  constructor(
    private dialog: MatDialog,
    private firebaseService: FirebaseService,
    private loaderService: LoaderService,
    private _snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    this.getTransPortList()
  }

  applyFilter(filterValue: string): void {
    this.transPortDataSource.filter = filterValue.trim().toLowerCase();
  }

  getTransPortList() {
    this.loaderService.setLoader(true)
    this.firebaseService.getAllTransPort().subscribe((res: any) => {
      if (res) {
        this.transPortList = res.filter((id: any) => id.userId === localStorage.getItem("userId"))
        this.transPortDataSource = new MatTableDataSource(this.transPortList);
        this.transPortDataSource.paginator = this.paginator;
        this.loaderService.setLoader(false)
      }
    })
  }

  addTransPort(action: string, obj: any) {
    obj.action = action;
    const dialogRef = this.dialog.open(TransPortDialogComponent, {
      data: obj,
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result?.event === 'Add') {
        const payload: TransPortList = {
          id: '',
          header: result.data.header,
          subHeader: result.data.subHeader,
          address: result.data.address,
          mobileNo: Number(result.data.mobileNo),
          transPortCompany: result.data.transPortCompany,
          transPortId: result.data.transPortId,
          userId: localStorage.getItem("userId"),
        }
        this.firebaseService.addTransPort(payload).then((res) => {
          if (res) {
            this.getTransPortList()
            this.openConfigSnackBar('record create successfully')
          }
        }, (error) => {
          console.log("error=>", error);

        })
      }
      if (result?.event === 'Edit') {
        this.transPortList.forEach((element: any) => {
          if (element.id === result.data.id) {
            const payload: TransPortList = {
              id: result.data.id,
              header: result.data.header,
              subHeader: result.data.subHeader,
              address: result.data.address,
              mobileNo: Number(result.data.mobileNo),
              transPortCompany: result.data.transPortCompany,
              transPortId: result.data.transPortId,
              userId: localStorage.getItem("userId"),
            }
            this.firebaseService.updateTransPort(result.data.id, payload).then((res: any) => {
              this.getTransPortList()
              this.openConfigSnackBar('record update successfully')
            }, (error) => {
              console.log("error => ", error);

            })
          }
        });
      }
      if (result?.event === 'Delete') {
        this.firebaseService.deleteTransPort(result.data.id).then((res: any) => {
          this.getTransPortList()
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

   formatAddress(address: string): string {
  if (!address) return '';

  const words = address.split(' ');
  let result = '';
  let line = '';

  words.forEach(word => {
    if ((line + word).length > 80) {
      result += line + '<br>';
      line = '';
    }
    line += word + ' ';
  });

  return result + line;
}

}
