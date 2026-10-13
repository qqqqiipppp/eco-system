import {environmentEventConfig} from '../../data/environment-events.js';
export const createEnvironmentEventState=(time=0)=>({sequence:0,cursor:0,nextAt:time+environmentEventConfig.initialDelay,activeId:null,history:[]});
