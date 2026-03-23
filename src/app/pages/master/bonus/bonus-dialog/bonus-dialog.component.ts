import { Component, Inject, OnInit, Optional } from '@angular/core';
import { FormGroup, FormBuilder } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FirebaseService } from 'src/app/services/firebase.service';
import { LoaderService } from 'src/app/services/loader.service';

@Component({
  selector: 'app-bonus-dialog',
  templateUrl: './bonus-dialog.component.html',
  styleUrls: ['./bonus-dialog.component.scss']
})
export class BonusDialogComponent  implements OnInit {
  bonusForm: FormGroup;
  action: string;
  local_data: any;
  employeeList:any [] = [];

  constructor(
    private fb: FormBuilder,
     private firebaseService : FirebaseService ,
        private loaderService : LoaderService,
    public dialogRef: MatDialogRef<BonusDialogComponent>,
    @Optional() @Inject(MAT_DIALOG_DATA) public data: any
  ) {

    this.local_data = { ...data };
    this.action = this.local_data.action;
  }
  ngOnInit(): void {
    this.buildForm();
    this.getEmployeeList();
    if (this.action === 'Edit') {
     this.bonusForm.controls['date'].setValue(  new Date(this.local_data.date.seconds * 1000));
      this.bonusForm.controls['employee'].setValue(this.local_data.employee)
      this.bonusForm.controls['amount'].setValue(this.local_data.amount)
    }
  }

  buildForm() {
    this.bonusForm = this.fb.group({
       date: [new Date()],
       employee:[''],
       amount:[]
    })
  }

   getEmployeeList() {
      this.loaderService.setLoader(true)
      this.firebaseService.getAllEmployee().subscribe((res: any) => {
        if (res) {
          this.employeeList = res.filter((id:any) => id.userId === localStorage.getItem("userId"))
          this.loaderService.setLoader(false)
        }
      })
    }

  doAction(): void {
    const payload = {
      id: this.local_data.id ? this.local_data.id : '',
      date: this.bonusForm.value.date,
      employee: this.bonusForm.value.employee,
      amount: this.bonusForm.value.amount,
    }
    this.dialogRef.close({ event: this.action, data: payload });
  }

  closeDialog(): void {
    this.dialogRef.close({ event: 'Cancel' });
  }
}