export function createHelpView(preference) {
 const dialog=document.querySelector('#help-dialog');
 const purpose=document.querySelector('#help-purpose'),controls=document.querySelector('#help-controls');
 function open(){purpose.hidden=false;controls.hidden=true;dialog.showModal();}
 function close(){preference.markSeen();dialog.close();}
 document.querySelector('#help-open').addEventListener('click',open);
 document.querySelector('#help-start').addEventListener('click',()=>{purpose.hidden=true;controls.hidden=false;});
 for(const id of ['help-skip','help-finish','help-close'])document.querySelector('#'+id).addEventListener('click',close);
 dialog.addEventListener('close',()=>preference.markSeen());
 return {open,showForNewGame(isNew){if(isNew&&!preference.read())open();}};
}
