import {environment} from '../constant';

class Endpoints {
  baseUrl = environment.baseUrl;
  LOGIN = this.baseUrl + 'authenticate';
}

export const API = new Endpoints();