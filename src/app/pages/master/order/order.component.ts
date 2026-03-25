import { Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTable, MatTableDataSource } from '@angular/material/table';
import { FirebaseService } from 'src/app/services/firebase.service';
import { LoaderService } from 'src/app/services/loader.service';
import { OrderDialogComponent } from './order-dialog/order-dialog.component';
import { OrderList } from 'src/app/interface/invoice';
import { ViewDialogComponent } from './view-dialog/view-dialog.component';

@Component({
  selector: 'app-order',
  templateUrl: './order.component.html',
  styleUrls: ['./order.component.scss']
})
export class OrderComponent implements OnInit {
  displayedColumns: string[] = [
    'srno',
    'partyName',
    'pOrder',
    'orderDate',
    'deliveryDate',
    'status',
    'action',
  ];

  orderList: any[] = []
  partyList: any[] = []

  orderDataSource = new MatTableDataSource(this.orderList);
  @ViewChild(MatTable, { static: true }) table: MatTable<any> = Object.create(null);
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator = Object.create(null);

  constructor(private dialog: MatDialog,
    private firebaseService: FirebaseService,
    private loaderService: LoaderService,
    private _snackBar: MatSnackBar,) { }

  ngOnInit(): void {
    this.getOrderList();
    this.getPartyList();
  }

  applyFilter(filterValue: string): void {
    this.orderDataSource.filter = filterValue.trim().toLowerCase();
    this.SearchFilter()
  }

  SearchFilter() {
    this.orderDataSource.filterPredicate = (data: any, filter: string) => {
      const searchText = filter.trim().toLowerCase();
      const partyOrder = data.partyOrder?.toString().toLowerCase() || '';

      const partyName =
        this.partyList.find((p: any) => p.id === data.partyName)?.partyName
          ?.toLowerCase() || '';

      return (
        partyOrder.includes(searchText) ||
        partyName.includes(searchText)
      );
    };
  }


  getOrderList() {
    this.loaderService.setLoader(true)
    this.firebaseService.getAllOrder().subscribe((res: any) => {
      if (res) {
        this.orderList = res.filter((id: any) => id.userId === localStorage.getItem("userId"))

          .map((order:any) => ({
          ...order,
          status: order.status || 'Pending'  // ✅ Default to Pending if missing
        }));
        this.orderDataSource = new MatTableDataSource(this.orderList);
        this.orderDataSource.paginator = this.paginator;
        this.loaderService.setLoader(false)
      }
    })
  }

  addOrder(action: string, obj: any) {
    obj.action = action;
    const dialogRef = this.dialog.open(OrderDialogComponent, {
      data: obj,
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result?.event === 'Add') {
        const payload: OrderList = {
          id: '',
          partyName: result.data.partyName,
          partyOrder: result.data.partyOrder,
          orderDate: result.data.orderDate,
          deliveryDate: result.data.deliveryDate,
          products: result.data.products.map((detail: any) => ({
            productPrice: detail.productPrice,
            productQuantity: detail.productQuantity,
          })),
          userId: localStorage.getItem("userId"),
        }
        this.firebaseService.addOrder(payload).then((res) => {
          if (res) {
            this.getOrderList()
            this.openConfigSnackBar('record create successfully')
          }
        }, (error) => {
          console.log("error=>", error);

        })
      }
      if (result?.event === 'Edit') {
        this.orderList.forEach((element: any) => {
          if (element.id === result.data.id) {
            const payload: OrderList = {
              id: result.data.id,
              partyName: result.data.partyName,
              partyOrder: result.data.partyOrder,
              orderDate: result.data.orderDate,
              deliveryDate: result.data.deliveryDate,
              products: result.data.products.map((detail: any) => ({
                productPrice: detail.productPrice,
                productQuantity: detail.productQuantity
              })),
              userId: localStorage.getItem("userId"),
            }
            this.firebaseService.updateOrder(result.data.id, payload).then((res: any) => {
              this.getOrderList()
              this.openConfigSnackBar('record update successfully')
            }, (error) => {
              console.log("error => ", error);

            })
          }
        });
      }
      if (result?.event === 'Delete') {
        this.firebaseService.deleteOrder(result.data.id).then((res: any) => {
          this.getOrderList()
          this.openConfigSnackBar('record delete successfully')
        }, (error) => {
          console.log("error => ", error);

        })
      }
    });
  }


    updateBrokerage(element: any) {
    console.log('Updated Status:', element.status);

    const payload = {
      ...element,    // 👈 important
      userId: localStorage.getItem("userId")
    };

    this.firebaseService.updateOrder(element.id, payload).then((res: any) => {
      this.getOrderList()
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

  getPartyList() {
    this.loaderService.setLoader(true)
    this.firebaseService.getAllParty().subscribe((res: any) => {
      if (res) {
        this.partyList = res.filter((id: any) => id.userId === localStorage.getItem("userId"))

        this.loaderService.setLoader(false)
      }
    })
  }

  getPartyName(nameid: any) {
    return this.partyList.find((id: any) => id.id === nameid)?.partyName
  }

  ViewOrder(obj: any) {
    const dialogRef = this.dialog.open(ViewDialogComponent, {
      data: obj,
    });
  }
}
