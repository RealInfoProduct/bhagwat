import { Component, OnInit } from '@angular/core';
import { MaterialModule } from '../../../material.module';
import { CommonModule } from '@angular/common';
import { FirebaseService } from 'src/app/services/firebase.service';
import { LoaderService } from 'src/app/services/loader.service';
import { MatTableDataSource } from '@angular/material/table';


export interface productsData {
  id: number;
  imagePath: string;
  uname: string;
  position: string;
  productName: string;
  budget: number;
  priority: string;
}

const ELEMENT_DATA: productsData[] = [
  // {
  //   id: 1,
  //   imagePath: 'assets/images/profile/user-1.jpg',
  //   uname: 'Sunil Joshi',
  //   position: 'Web Designer',
  //   productName: 'Elite Admin',
  //   budget: 3.9,
  //   priority: 'low'
  // },
  // {
  //   id: 2,
  //   imagePath: 'assets/images/profile/user-2.jpg',
  //   uname: 'Andrew McDownland',
  //   position: 'Project Manager',
  //   productName: 'Real Homes Theme',
  //   budget: 24.5,
  //   priority: 'medium'
  // },
  // {
  //   id: 3,
  //   imagePath: 'assets/images/profile/user-3.jpg',
  //   uname: 'Christopher Jamil',
  //   position: 'Project Manager',
  //   productName: 'MedicalPro Theme',
  //   budget: 12.8,
  //   priority: 'high'
  // },
  // {
  //   id: 4,
  //   imagePath: 'assets/images/profile/user-4.jpg',
  //   uname: 'Nirav Joshi',
  //   position: 'Frontend Engineer',
  //   productName: 'Hosting Press HTML',
  //   budget: 2.4,
  //   priority: 'critical'
  // },
];


@Component({
  selector: 'app-top-projects',
  standalone: true,
  imports: [MaterialModule, CommonModule],
  templateUrl: './top-projects.component.html',
})
export class AppTopProjectsComponent implements OnInit {

  displayedColumns: string[] = ['invoiceNo', 'partyName', 'date', 'finalAmount', 'pendingAmount'];
  dataSource = new MatTableDataSource<any>();
  invoiceList: any[] = [];

  constructor(
    private firebaseService: FirebaseService,
    private loaderService: LoaderService,
  ) { }

  ngOnInit(): void {
    this.getInvoiceList()
  }

  getInvoiceList() {
    this.loaderService.setLoader(true)

    const today = new Date();
    this.firebaseService.getAllInvoice().subscribe((res: any) => {
      if (res) {
        this.invoiceList = res
          .filter((id: any) => {
            const dueDate = new Date(id.dueDate);

            return (
              id.userId === localStorage.getItem("userId") &&
              id.accountYear === localStorage.getItem("accountYear") &&

              // 👉 current date == dueDate
              dueDate.toDateString() === today.toDateString()
            );
          })
          .map((invoice: any) => {

            // receivePayment નો sum
            const totalReceived = invoice.receivePayment
              ? invoice.receivePayment.reduce(
                (sum: number, p: any) => sum + (p.paymentAmount || 0),
                0
              )
              : 0;

            // pending amount calculate
            console.log(totalReceived);

            invoice.pendingAmount = invoice.finalSubAmount - totalReceived;

            return invoice;
          });

        this.dataSource.data = this.invoiceList;

        console.log(this.dataSource.data);

        this.loaderService.setLoader(false);
      }
    });
  }

}
