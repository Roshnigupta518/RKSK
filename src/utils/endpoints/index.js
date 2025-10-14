import {environment} from '../constant';

class Endpoints {
  baseUrl = environment.baseUrl;
  LOGIN = this.baseUrl + 'Auth/login';
}

export const API = new Endpoints();