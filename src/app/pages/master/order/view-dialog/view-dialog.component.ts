import { Component, Inject, OnInit, Optional, ViewChild } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatTable, MatTableDataSource } from '@angular/material/table';

@Component({
  selector: 'app-view-dialog',
  templateUrl: './view-dialog.component.html',
  styleUrls: ['./view-dialog.component.scss']
})
export class ViewDialogComponent implements OnInit {
  displayedColumns: string[] = [
    'srno',
    'pOrder',
    'quantity',
    'price',
    'total'
  ];

  Viewcompany :any = []
    viewDataSource = new MatTableDataSource<any>();
  @ViewChild(MatTable, { static: true }) table: MatTable<any> = Object.create(null);
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator = Object.create(null);

  constructor(
    public dialogRef: MatDialogRef<ViewDialogComponent>,
    @Optional() @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.Viewcompany = { ...data };
}
      
  

 ngOnInit(): void {
  const details = this.Viewcompany;

  const tableData = details.products.map((p: any) => ({
    ...p,
    partyOrder: details.partyOrder
  }));

  this.viewDataSource = new MatTableDataSource(tableData);

}


ngAfterViewInit() {
  this.viewDataSource.paginator = this.paginator;
}
}
