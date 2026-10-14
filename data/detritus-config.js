import {ecologySeconds,ecologyRate,scaleFields} from './pacing-config.js';
// Teaching-game rates; not measured Amynthas koreanus biological rates.
export const earthwormConfig={rate:.003,activeLimit:3,soilPerUnit:.02,soilMaximum:.12,soilCeiling:.6,helpMinimum:.4};
export const organicNoticeConfig={historyLimit:20,noticeLimit:6,lifetimeSeconds:120};
export const organicLabels={wood:'목재 유기물',litter:'식물 잔해 유기물',remains:'동물 유래 유기물'};
export const organicWorkers={wood:['mushroom'],litter:['litter-mold','earthworm'],remains:['soil-bacteria']};

scaleFields(earthwormConfig,['rate'],ecologyRate);
// The 120-second interest marker remains observation/reading time.
