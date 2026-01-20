import {environment} from '../constant';

class Endpoints {
  baseUrl = environment.baseUrl;
  LOGIN = this.baseUrl + 'Auth/login';
  GET_ATP = this.baseUrl + 'ATP/GetATVPlanDetails?'
  ATP_POST = this.baseUrl + 'ATP/uploadActivity'
  Activity_Login = this.baseUrl + 'ATP/FiledActivityTimeTracking'
  GET_VERSION = this.baseUrl + ''
  GET_PEEREDUCATOR_LIST = this.baseUrl + 'PeerEducator/GetPeerEducatorForEdit'
  GET_MASTER = this.baseUrl + 'Masters?'
}

export const API = new Endpoints();