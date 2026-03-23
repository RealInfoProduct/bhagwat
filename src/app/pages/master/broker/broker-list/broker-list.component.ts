import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource, MatTable } from '@angular/material/table';
import { FirebaseService } from 'src/app/services/firebase.service';
import { LoaderService } from 'src/app/services/loader.service';

@Component({
  selector: 'app-broker-list',
  templateUrl: './broker-list.component.html',
  styleUrls: ['./broker-list.component.scss']
})
export class BrokerListComponent implements OnInit {
  displayedColumns: string[] = [
    '#',
    'party',
    'broker',
    'invoiceNo',
    'pONumber',
    'finalAmount',
    'brokerPercentage',
    'brokerAmount',
    'status'
  ];

  dateBrokerageListForm: FormGroup;
  brokerageList: any[] = [];
  partyList: any[] = [];
  brokerList: any[] = [];

  brokerageDataSource = new MatTableDataSource(this.brokerageList);
  @ViewChild(MatTable, { static: true }) table: MatTable<any> = Object.create(null);
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator = Object.create(null);

  constructor(
    private fb: FormBuilder,
    private firebaseService: FirebaseService,
    private loaderService: LoaderService,
    private _snackBar: MatSnackBar,
  ) { }

  ngOnInit(): void {
    const today = new Date();
    const startDate = new Date(today.getFullYear(), today.getMonth(), 1);
    const endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    this.dateBrokerageListForm = this.fb.group({
      start: [startDate],
      end: [endDate]
    });
    this.getBrokerageList();
    this.getPartyList();
    this.getBrokerList()
  }

  applyFilter(filterValue: string): void {
    this.brokerageDataSource.filter = filterValue.trim().toLowerCase();
  }

  filterDate() {
    if (!this.brokerageList) return;
    const startDate = this.dateBrokerageListForm.value.start ? new Date(this.dateBrokerageListForm.value.start) : null;
    const endDate = this.dateBrokerageListForm.value.end ? new Date(this.dateBrokerageListForm.value.end) : null;
    if (startDate && endDate) {
      this.brokerageDataSource.data = this.brokerageList.filter((invoice: any) => {
        if (!invoice.selectDate) return false;

        const invoiceDate = new Date(invoice.selectDate);

        return invoiceDate >= startDate && invoiceDate <= endDate;
      });
    } else {
      this.brokerageDataSource.data = this.brokerageList;
    }
  }

  getBrokerageList() {
    this.loaderService.setLoader(true)
    this.firebaseService.getAllBrokerage().subscribe((res: any) => {
      if (res) {
        this.brokerageList = res.filter((id: any) => id.userId === localStorage.getItem("userId"))
        this.brokerageDataSource = new MatTableDataSource(this.brokerageList);
        this.brokerageDataSource.paginator = this.paginator;
        this.filterDate()
        this.loaderService.setLoader(false)
      }
    })
  }

  getPartyList() {
    this.loaderService.setLoader(true)
    this.firebaseService.getAllParty().subscribe((res: any) => {
      if (res) {
        this.partyList = res.filter((id: any) => id.userId === localStorage.getItem("userId"))

        this.loaderService.setLoader(false)
      }
    })
  }

  getPartyName(nameId: any) {
    return this.partyList.find((id: any) => id.id === nameId)?.partyName
  }

  getBrokerList() {
    this.loaderService.setLoader(true)
    this.firebaseService.getAllBroker().subscribe((res: any) => {
      if (res) {
        this.brokerList = res.filter((id: any) => id.userId === localStorage.getItem("userId"))
        this.loaderService.setLoader(false)
      }
    })
  }

  getBrokerName(nameId: any) {
    return this.brokerList.find((id: any) => id.id === nameId)?.header
  }
  getBrokerlast(nameId: any) {
    return this.brokerList.find((id: any) => id.id === nameId)?.subHeader
  }

  getBrokerAmount(element: any): number {
    const finalAmount = Number(element.finalAmount) || 0;
    const brokerPercentage = Number(element.brokerPercentage) || 0;

    return Math.round((finalAmount * brokerPercentage) / 100);

  }

  updateBrokerage(element: any) {
    console.log('Updated Status:', element.status);

    const payload = {
      ...element,    // 👈 important
      userId: localStorage.getItem("userId")
    };

    this.firebaseService.updateBrokerage(element.id, payload).then((res: any) => {
      this.getBrokerList()
      this.openConfigSnackBar('record update successfully')
    }, (error) => {
      console.log("error => ", error);

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
