import { Component, Inject, OnInit, Optional } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FirebaseService } from 'src/app/services/firebase.service';
import { LoaderService } from 'src/app/services/loader.service';

@Component({
  selector: 'app-attendance-dialog',
  templateUrl: './attendance-dialog.component.html',
  styleUrls: ['./attendance-dialog.component.scss']
})
export class AttendanceDialogComponent implements OnInit {
  attendanceForm: FormGroup;
  action: string;
  local_data: any;
  employeeList:any [] = [];

  constructor(
    private fb: FormBuilder,
     private firebaseService : FirebaseService ,
        private loaderService : LoaderService,
    public dialogRef: MatDialogRef<AttendanceDialogComponent>,
    @Optional() @Inject(MAT_DIALOG_DATA) public data: any
  ) {

    this.local_data = { ...data };
    this.action = this.local_data.action;
  }
  ngOnInit(): void {
    this.buildForm();
    this.getEmployeeList();
    if (this.action === 'Edit') {
     this.attendanceForm.controls['date'].setValue(  new Date(this.local_data.date.seconds * 1000));
      this.attendanceForm.controls['employee'].setValue(this.local_data.employee)
      this.attendanceForm.controls['day'].setValue(this.local_data.day)
    }
  }

  buildForm() {
    this.attendanceForm = this.fb.group({
       date: [new Date()],
       employee:[''],
       day:[]
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
      date: this.attendanceForm.value.date,
      employee: this.attendanceForm.value.employee,
      day: this.attendanceForm.value.day,
    }
    this.dialogRef.close({ event: this.action, data: payload });
  }

  closeDialog(): void {
    this.dialogRef.close({ event: 'Cancel' });
  }
}