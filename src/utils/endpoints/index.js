import {environment} from '../constant';

class Endpoints {
  baseUrl = environment.baseUrl;
  LOGIN = this.baseUrl + 'Auth/login';
  GET_ATP = this.baseUrl + 'ATP/GetATVPlanDetails?'
  ATP_POST = this.baseUrl + 'ATP/uploadActivity'
}

export const API = new Endpoints();