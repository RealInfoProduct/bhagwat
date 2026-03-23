import { Component, Inject, OnInit, Optional } from '@angular/core';
import { FormGroup, FormBuilder } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FirebaseService } from 'src/app/services/firebase.service';
import { LoaderService } from 'src/app/services/loader.service';

@Component({
  selector: 'app-machine-salary-dialog',
  templateUrl: './machine-salary-dialog.component.html',
  styleUrls: ['./machine-salary-dialog.component.scss']
})
export class MachineSalaryDialogComponent implements OnInit {
  machineSalaryForm: FormGroup;
  action: string;
  local_data: any;
  employeeList:any [] = [];

  constructor(
    private fb: FormBuilder,
    private firebaseService : FirebaseService ,
    private loaderService : LoaderService,
    public dialogRef: MatDialogRef<MachineSalaryDialogComponent>,
    @Optional() @Inject(MAT_DIALOG_DATA) public data: any
  ) {

    this.local_data = { ...data };
    this.action = this.local_data.action;
  }
  ngOnInit(): void {
    this.buildForm();
    this.getEmployeeList();
    if (this.action === 'Edit') {
      this.machineSalaryForm.controls['date'].setValue(  new Date(this.local_data.date.seconds * 1000));
      this.machineSalaryForm.controls['employee'].setValue(this.local_data.employee)
      this.machineSalaryForm.controls['amount'].setValue(this.local_data.amount)
    }
  }

  buildForm() {
    this.machineSalaryForm = this.fb.group({
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
      date: this.machineSalaryForm.value.date,
      employee: this.machineSalaryForm.value.employee,
      amount: this.machineSalaryForm.value.amount,
    }
    this.dialogRef.close({ event: this.action, data: payload });
    
  }

  closeDialog(): void {
    this.dialogRef.close({ event: 'Cancel' });
  }
}
