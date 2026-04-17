import { Component, OnInit, ViewChild } from '@angular/core';
import {
  ApexChart,
  ChartComponent,
  ApexDataLabels,
  ApexLegend,
  ApexStroke,
  ApexTooltip,
  ApexAxisChartSeries,
  ApexXAxis,
  ApexYAxis,
  ApexGrid,
  ApexPlotOptions,
  ApexFill,
  ApexMarkers,
  NgApexchartsModule,
} from 'ng-apexcharts';
import { MaterialModule } from '../../../material.module';
import { TablerIconsModule } from 'angular-tabler-icons';
import { NgForOf } from '@angular/common';
import { LoaderService } from 'src/app/services/loader.service';
import { FirebaseService } from 'src/app/services/firebase.service';

interface month {
  value: number;
  viewValue: string;
}

export interface revenueChart {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  dataLabels: ApexDataLabels;
  plotOptions: ApexPlotOptions;
  yaxis: ApexYAxis;
  xaxis: ApexXAxis;
  fill: ApexFill;
  tooltip: ApexTooltip;
  stroke: ApexStroke;
  legend: ApexLegend;
  grid: ApexGrid;
  marker: ApexMarkers;
}

@Component({
  selector: 'app-revenue-updates',
  standalone: true,
  imports: [NgApexchartsModule, MaterialModule, TablerIconsModule, NgForOf],
  templateUrl: './revenue-updates.component.html',
})
export class AppRevenueUpdatesComponent implements OnInit {

  @ViewChild('chart') chart: ChartComponent = Object.create(null);
  public revenueChart!: Partial<revenueChart> | any;
  currentYear: number = new Date().getFullYear();
  currentMonthValue = new Date().getMonth();

  months: month[] = [
    { value: 0, viewValue: `January ${this.currentYear}` },
    { value: 1, viewValue: `February ${this.currentYear}` },
    { value: 2, viewValue: `March ${this.currentYear}` },
    { value: 3, viewValue: `April ${this.currentYear}` },
    { value: 4, viewValue: `May ${this.currentYear}` },
    { value: 5, viewValue: `June ${this.currentYear}` },
    { value: 6, viewValue: `July ${this.currentYear}` },
    { value: 7, viewValue: `August ${this.currentYear}` },
    { value: 8, viewValue: `September ${this.currentYear}` },
    { value: 9, viewValue: `October ${this.currentYear}` },
    { value: 10, viewValue: `November ${this.currentYear}` },
    { value: 11, viewValue: `December ${this.currentYear}` }
  ];
  totalExpense: number = 0;
  totalIncome: number = 0;
  totalEarnings: number = 0;
  expensesList: any[] = []
  invoiceList: any[] = []

  constructor(
    private loaderService: LoaderService,
    private firebaseService: FirebaseService,
  ) {

    this.revenueChart = {
      series: [
        {
          name: 'Eanings this month',
          data: [],
          color: '#5D87FF',
        },
        {
          name: 'Expense this month',
          data: [],
          color: '#49BEFF',
        },
      ],
      chart: {
        type: 'bar',
        stacked: true,
        height: 380,
        toolbar: { show: false },
      },
      plotOptions: {
        bar: { columnWidth: '20%', borderRadius: 6 },
      },
      dataLabels: { enabled: false },
      legend: { show: false },
      xaxis: {
        categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      },
    };

    const now = new Date();
    const monthIndex = now.getMonth();
    this.currentMonthValue = this.months[monthIndex].value;

  }

  ngOnInit(): void {
    this.getExpensesList()
    this.getInvoiceList()
  }

  getExpensesList() {
    this.loaderService.setLoader(true)
    this.firebaseService.getAllExpenses().subscribe((res: any) => {
      if (res) {
        this.expensesList = res.filter((id: any) => id.userId === localStorage.getItem("userId"))

        // 👉 amount નો sum
        this.totalExpense = this.expensesList.reduce((sum: number, item: any) => {
          return sum + (Number(item.amount) || 0);
        }, 0);
        this.calculateMonthWiseTotals()
        this.loaderService.setLoader(false)
      }
    })
  }

  getInvoiceList() {
    this.loaderService.setLoader(true)
    this.firebaseService.getAllInvoice().subscribe((res: any) => {
      if (res) {
        this.invoiceList = res.filter((id: any) =>
          id.userId === localStorage.getItem("userId") &&
          id.accountYear === localStorage.getItem("accountYear")
        )
        this.totalIncome = this.invoiceList.reduce((sum: number, item: any) => {
          return sum + (Number(item.finalSubAmount) || 0);
        }, 0);
        this.calculateMonthWiseTotals()
        this.loaderService.setLoader(false)
      }
    })
  }

  getMonthFromAnyDate(rawDate: any): number {
    let date: Date;

    if (rawDate?.seconds) {
      date = new Date(rawDate.seconds * 1000);
    } else if (typeof rawDate === 'number') {
      date = new Date(rawDate);
    } else if (rawDate instanceof Date) {
      date = rawDate;
    } else {
      date = new Date(rawDate);
    }

    return date.getMonth();
  }

  calculateMonthWiseTotals() {

  const incomeData = new Array(12).fill(0);
  const expenseData = new Array(12).fill(0);

  // 👉 Expense month-wise
  this.expensesList.forEach((item: any) => {
    const month = this.getMonthFromAnyDate(item.creditDate);
    expenseData[month] += Number(item.amount) || 0;
  });

  // 👉 Income month-wise
  this.invoiceList.forEach((item: any) => {
    const month = this.getMonthFromAnyDate(item.date);
    incomeData[month] += Number(item.finalSubAmount) || 0;
  });

  // 👉 Selected month totals (for cards)
  this.totalIncome = incomeData[this.currentMonthValue];
  this.totalExpense = expenseData[this.currentMonthValue];
  this.totalEarnings = this.totalIncome - this.totalExpense;

  // 👉 Update chart with FULL year data
  this.revenueChart = {
    ...this.revenueChart,
    series: [
      {
        name: 'Earnings',
        data: incomeData,
        color: '#5D87FF',
      },
      {
        name: 'Expenses',
        data: expenseData,
        color: '#49BEFF',
      },
    ],
  };
}

  onMonthChange(month: number) {
    this.currentMonthValue = month;
    this.calculateMonthWiseTotals();
  }

  formatIndianAmount(value: number): string {
    return value?.toLocaleString('en-IN') ?? '0';
  }


}
