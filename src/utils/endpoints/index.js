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
  GET_PEEREDUCATOR_REFERRAL_LIST = this.baseUrl + 'PeerEducator/GetPeerEducatorReportinFormList'
  SAVE_PEEREDICATOR_REFERRAL = this.baseUrl + 'PeerEducator/PeerForm'
  PEER_REPORT_COUNT = this.baseUrl + 'PeerEducator/GetPeerEducatorReportingEntryCount'
  GET_Asha_ByVacant_Ashasahyogi = this.baseUrl + 'Masters/GetAsha_ByVacant_Ashasahyogi'
  SAVE_PEER_BRIGADE_FORM = this.baseUrl + 'PeerEducatorbrigade/InsertPeerEducator'
  GET_PEER_BRIGADE_LIST = this.baseUrl + 'PeerEducatorbrigade/GetPeerEducatorBrigadeMembers'
  GET_MATERIALS = this.baseUrl + 'PeerEducatorbrigade/IECDetails'
  GET_VIDEOS = this.baseUrl + 'PeerEducatorbrigade/GetAwarenessVideo'
  GET_PROFILE_Trainer = this.baseUrl + 'ATP/GetProfile_Trainer?'
  GET_PEER_PROFILE = this.baseUrl + 'PeerEducator/GetProfile_PeerEducator?'
  VALIDATE_MOBILE = this.baseUrl + 'PeerEducatorbrigade/ValidateMobile'
}

export const API = new Endpoints();