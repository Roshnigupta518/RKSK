import {environment} from '../constant';

class Endpoints {
  baseUrl = environment.baseUrl;
  LOGIN = this.baseUrl + 'Auth/login';
  GET_ATP = this.baseUrl + 'ATP/GetATVPlanDetails?'
}

export const API = new Endpoints();