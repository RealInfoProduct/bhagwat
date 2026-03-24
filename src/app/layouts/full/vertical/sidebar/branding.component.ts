import { NgIf } from '@angular/common';
import { Component } from '@angular/core';
import { CoreService } from 'src/app/services/core.service';

@Component({
  selector: 'app-branding',
  standalone: true,
  imports: [NgIf],
  template: `
    <div class="branding d-flex align-items-center justify-content-center">
      <a href="/" *ngIf="options.theme === 'light'">
        <img
          src="../../../../../assets/images/logos/Green Orange Renewable Energy Company Logo_20250519_130127_0000.svg"
          class="align-middle m-2"
          alt="logo"
          width="100"
        />
      </a>
      <a href="/" *ngIf="options.theme === 'dark'">
        <img
          src="../../../../../assets/images/logos/myinvoicelogodark.svg"
          class="align-middle m-2"
          alt="logo"
           width="200"
        />
      </a>
    </div>
  `,
})
export class BrandingComponent {
  options = this.settings.getOptions();
 
  constructor(private settings: CoreService) {}
}
