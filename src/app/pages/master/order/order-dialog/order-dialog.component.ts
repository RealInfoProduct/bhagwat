import { Component, Inject, OnInit, Optional } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FirebaseService } from 'src/app/services/firebase.service';
import { LoaderService } from 'src/app/services/loader.service';

@Component({
  selector: 'app-order-dialog',
  templateUrl: './order-dialog.component.html',
  styleUrls: ['./order-dialog.component.scss']
})
export class OrderDialogComponent implements OnInit {
  orderForm: FormGroup;
  action: string;
  local_data: any;
  partyList: any = []

  constructor(
    private fb: FormBuilder,
    private firebaseService: FirebaseService,
    private loaderService: LoaderService,
    public dialogRef: MatDialogRef<OrderDialogComponent>,
    @Optional() @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.local_data = { ...data };
    this.action = this.local_data.action;
  }

  ngOnInit(): void {
    this.buildForm()
    this.getPartyList()
    this.addProduct()
  if (this.action === 'Edit') {
  this.orderForm.patchValue({
    partyName: this.local_data.partyName,
    partyOrder: this.local_data.partyOrder,
    orderDate: new Date(this.local_data.orderDate.toDate()),
    deliveryDate: new Date(this.local_data.deliveryDate.toDate()),
  });

  const productsArray = this.getProductsFormArry();
  productsArray.clear();

  this.local_data.products.forEach((product: any) => {
    productsArray.push(
      this.fb.group({
        productPrice: [product.productPrice, Validators.required],
        productQuantity: [product.productQuantity, Validators.required],
      })
    );
  });
}
  }

  buildForm() {
    this.orderForm = this.fb.group({
      partyName: [''],
      partyOrder: [],
      orderDate: [],
      deliveryDate: [],
      products: this.fb.array([]),
    })
  }

  getProductsFormArry(): FormArray {
    return this.orderForm.get('products') as FormArray
  }

  addProduct() {
    this.getProductsFormArry().push(
      this.fb.group({
        productPrice: ['', Validators.required],
        productQuantity: ['', Validators.required],
      })
    );
  }

  removeProduct(index: any) {
    this.getProductsFormArry().removeAt(index)
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

  orderform() {
    const payload = {
      id: this.local_data.id ? this.local_data.id : '',
      partyName: this.orderForm.value.partyName,
      partyOrder: this.orderForm.value.partyOrder,
      orderDate: this.orderForm.value.orderDate,
      deliveryDate: this.orderForm.value.deliveryDate,
      products: this.orderForm.value.products,
    }
    this.dialogRef.close({ event: this.action, data: payload });
    
  }

  closeDialog() {
    this.dialogRef.close({ event: 'Cancel' });
  }
}
