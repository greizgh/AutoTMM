// ==UserScript==
// @name           AutoTMM
// @author         Greizgh
// @namespace      grzgh.tmm
// @description    Automate pour TellMeMore
// @version        1.2.8
// @icon           http://he1.tellmemorecampus.com/favicon.ico
// @downloadURL    https://github.com/greizgh/AutoTMM/raw/master/AutoTellMeMore.user.js
// @updateURL      https://github.com/greizgh/AutoTMM/raw/master/AutoTellMeMore.user.js
// @match          http://*.tellmemorecampus.com/TellMeMore/*
// ==/UserScript==

// Conf part
// Menu
GM_registerMenuCommand("Changer la temporisation", conf_tempo, "t");
GM_registerMenuCommand("Régler automode", conf_automode, "a");
GM_registerMenuCommand("Régler réponses à 0%", conf_badans, "r");
// Temps par exercice (automatique seulement)
var tempo=GM_getValue("tempo",60000);//ms
function conf_tempo()
{
	var newtemp = prompt("Entrez le délai d'attente avant de réaliser l'exercice (millisecondes)", tempo);
	if (parseInt(newtemp)!=null){tempo=parseInt(newtemp);GM_setValue("tempo", tempo);}
}
// Auto mode: sauter les activités non gérées par le script
var automode = GM_getValue("automode", false);
function conf_automode()
{
	automode = confirm("Activer le mode automatique?\nActuel: "+automode);
	GM_setValue("automode", automode);
}
// Autoriser mauvaise réponse
var badans = GM_getValue("badans", false);
function conf_badans()
{
	badans = confirm("Autoriser les réponses à 0%\nActuel: "+badans);
	GM_setValue("badans", badans);
}
// Liste de correspondance activité -> action à mener
var activities={"Mot juste": qcm,
	"Support texte": delai_tempo,
	"Association image – mot": qcm,
	"Fiche vocabulaire": vocab,
	"Mots à retenir": delai_tempo,
	"Question de compréhension": qcm,
	"Support multimédia": multimedia,
	//"Remise dans l'ordre à l'oral": different_act,
	//"Prononciation de phrases": different_act,
	//"Prononciation de mots": quit,
	//"Prononciation": different_act,
	"Explications à retenir": explications,
	"Dictée": dictee,
	"D'une phrase à l'autre": complete_input,
	"D'un texte à l'autre": text2text,
	"D'un mot à l'autre": complete_input};
var badact={
	"Mots mêlés": solution,
	"Mot Mystère": pendu,
	"Association de mots": solution};
var user_required={
	"Dictée": dictee};
if(badans){
	for (ex in badact)
	{
		activities[ex]=badact[ex];
	}
}
for (ex in user_required)
{
	if(!automode){
		activities[ex]=user_required[ex];
	}
	else{
		activities[ex]=different_act;
	}
}
// Variables globales
var pid_check;
// Logging
if (unsafeWindow.console)
{
	var GM_log = unsafeWindow.console.log;
}
function fireClickById(id)
	//Simule un clique sur l'élément id
{
	button = document.getElementById(id);
	fireClickByNode(button);
}
function fireClickByNode(node)
	//Simule un clique sur l'élément passé
{
	var evt_down = document.createEvent('MouseEvents');
	evt_down.initEvent('mousedown', true, true);
	node.dispatchEvent(evt_down);
	var evt_click = document.createEvent('MouseEvents');
	evt_click.initEvent('click', true, true);
	node.dispatchEvent(evt_click);
}
function check()
	//Check si l'activité est validée, vérification autres
{
	if (is_finished()==true)
	{
		try {fireClickById('ctl00_c_ActivityContainer_ctl00_activityInformation_nl');}
		catch(e) {}
		try {fireClickById('ctl00_c_ActivityContainer_ctl00_tmmDashboard_nl');}
		catch(e) {}
		try {fireClickById('ctl00_c_ActivityContainer_ctl00_activityInformation_na');}
		catch(e) {}
	}
}
function is_finished()
	//Vrai si l'exercice est terminé
{
	try {
		if (document.getElementById('ctl00_c_ActivityContainer_ctl00_activityInformation_da').style.display=="block")
		{
			return true;
		}
		else
		{
			return false;
		}
	}
	catch(e){}
	try {
		if(document.getElementById('ctl00_c_ActivityContainer_ctl00_tmmDashboard_da').style.display=="block")
		{
			return true;
		}
		else
		{
			return false;
		}
	}
	catch(e){}
}
function detect_activity()
	//détermine l'activité en cours
{
	var match = false;
	var act_text = document.getElementById('ctl00_c_ActivityContainer_ctl00_tmmActivityTitle').childNodes[2].textContent;
	if (activities[act_text]){
		if (activities[act_text]==different_act){
			different_act();
		}
		else {
			if(activities[act_text]!=delai_tempo)
			{
				pid_check = window.setInterval(check, 3000);
			}
			window.setTimeout(activities[act_text], tempo);
		}
		match=true;
	}
	if (!match && automode)
	{
		if(badans){
			try{solution();}catch(e){}
			window.setTimeout(different_act, 6000);
		}
		else{
			different_act();
		}
	}
	if(!match){
		pid_check = window.setInterval(check, 3000);
	}
}
function different_act()
	//Passe à une activité différente
{
	try{fireClickById('ctl00_c_ActivityContainer_ctl00_activityInformation_d');} catch(e){}
	try{fireClickById('ctl00_c_ActivityContainer_ctl00_tmmDashboard_d');} catch(e) {}
}
function next_act()
	//Passe à l'activité suivante
{
	try{fireClickById('ctl00_c_ActivityContainer_ctl00_activityInformation_na');} catch(e){}
	try{fireClickById('ctl00_c_ActivityContainer_ctl00_tmmDashboard_na');} catch(e){}
}
function quit()
	//Ferme la session tellmemore
{
	clearInterval(pid_check);
	var quit_buttons=document.getElementsByClassName('quit').getElementsByTagName('a');
	for (var i=0;i<quit_buttons.length;i++)
	{
		click_all(quit_buttons[i]);
	}
	function quitconfirm(){fireClickById('ctl00_globalNavigationHeaderControl_QuitConfirmDialog_cOK');}
	window.setTimeout(quitconfirm, 1500);
}
function delai_tempo()
	//Action lors mots à retenir (attendre)
{
	window.setTimeout(check, tempo);
}
function qcm()
	//Action lors qcm
{
	var bconf = document.getElementById('ctl00_c_ActivityContainer_ctl00_ctl01').getElementsByClassName('confirm');
	var act=document.getElementById('ctl00_c_ActivityContainer_ctl00_ctl01').getElementsByTagName('input');
	var index = 0;
	function iter(){
		if (index<act.length && !is_finished()){
			fireClickByNode(act[index]);
			fireClickByNode(bconf[0]);
			index++;
		}
		if (is_finished())
		{
			clearInterval(pid_iter);
		}
	}
	var pid_iter = window.setInterval(iter, 5000);
}
function explications()
	//Action lors explications à retenir
{
	clearInterval(pid_check);
	var expl_list = document.getElementById('ctl00_c_ActivityContainer_ctl00_ctl01_GrammarListInfo').getElementsByTagName('div');
	for (var i=0; i<expl_list.length; i++)
	{
		click_all(expl_list[i]);
	}
	window.setTimeout(check, tempo);
}
function complete_input()
	//Fill all input with magic '-'
{
	var allin = document.getElementById('ctl00_c_ActivityContainer_ctl00_pnlSubActivity').getElementsByTagName('input');
	for (var i=0; i<allin.length; i++)
	{
		allin[i].value="-";
	}
	submit();
}
function multimedia()
	//Action lors video
{
	fireClickById('PlayButton');
}
function text2text()
	//Action lors texte à texte
{
	var txt_source = document.getElementById('ctl00_c_ActivityContainer_ctl00_ctl01_textArea').textContent;
	var txt_target = "";
	var ponct=[];
	var matchponct=[".","!","?"];
	for (var i=0; i<matchponct.length;i++)
	{
		var begin=0;
		var index=0;
		while(index!=-1)
		{
			var index=txt_source.indexOf(matchponct[i], begin);
			if(index!=-1)
			{
				ponct.push(matchponct[i]);
				GM_log(ponct);
			}
			begin=index+1;
		}
	}
	for(var i=0; i<ponct.length; i++)
	{
		txt_target+="-"+ponct[i];
	}
	document.getElementById('inputBox').value=txt_target;
	fireClickById('ctl00_c_ActivityContainer_ctl00_ctl01_confirmButton');
}
function vocab()
	//Action lors fiche vocabulaire
{
	var words=document.getElementById('ctl00_c_ActivityContainer_ctl00_ctl01_wordGroupListPanel').getElementsByTagName('a');
	var index=0;
	function iter(){
		if (index<words.length && !is_finished()){
			fireClickByNode(words[index]);
			index++;
		}
		if (is_finished()){
			clearInterval(pid_iter);
		}
	}
	var pid_iter = window.setInterval(iter, 5000);
}
function pendu()
	//Action lors mot mystere
{
	var keys=document.getElementById('ctl00_c_ActivityContainer_ctl00_ctl01_inputArea').getElementsByTagName('i');
	var index=0;
	function iter(){
		if (index<keys.length && !is_finished()){
			fireClickByNode(keys[index]);
			index++;
		}
		if (is_finished()){
			clearInterval(pid_iter);
		}
	}
	var pid_iter = window.setInterval(iter, 5000);
}
function dictee()
	//Action lors dictée
{
	function StoreReps()
	{
		var reps = document.getElementById('ctl00_c_ActivityContainer_ctl00_pnlSubActivity').getElementsByClassName('answerArea');
		for (var i=0; i<reps.length; i++)
		{
			var name="dictee_rep"+i;
			GM_setValue(name, reps[i].textContent);
		}
		GM_setValue("nbrep", reps.length);
		location.reload();
	}
	var nbrep=GM_getValue("nbrep",0);
	if(nbrep>0){//on a des réponses
		var reps=[];
		for (var i=0; i<nbrep;i++)
		{
			var name="dictee_rep"+i;
			reps.push(GM_getValue(name,"I <3 TellMeMore"));
		}
		var allin = document.getElementById('ctl00_c_ActivityContainer_ctl00_pnlSubActivity').getElementsByTagName('input');
		for (var i=0; i<allin.length; i++)
		{
			allin[i].value=reps[i];
		}
		GM_setValue('nbrep',0);//on efface les réponses, plus besoin
		window.setTimeout(submit, 5000);
	}
	else//pas de réponses enregistrées
	{
		clearInterval(pid_check);//on annule le check auto
		solution();//Click sur les solution pour afficher réponses
		window.setTimeout(StoreReps, 8000);//enregistre réponses
	}
}
function solution()
	//Clique sur les bouton solution
{
	var butt = document.getElementById('ctl00_c_ActivityContainer_ctl00_pnlSubActivity').getElementsByClassName('solution');
	for (var i=0;i<butt.length;i++)
	{
		fireClickByNode(butt[i]);
	}
}
function submit()
	//Clique sur les boutons soumettre
{
	var bconf = document.getElementById('ctl00_c_ActivityContainer_ctl00_pnlSubActivity').getElementsByClassName('confirm');
	for (var i=0; i<bconf.length; i++)
	{
		fireClickByNode(bconf[i]);
	}
}
function next_lesson()
	//Passe à la leçon suivante si applicable
{
	try{
		fireClickById('continueButton');
	}
	catch(e){}
}
function click_all(node)
	//Clique sur tous les sous éléments de node
{
	if (node.hasChildNodes())
	{
		for (var i=0; i<node.childNodes.length; i++)
		{
			click_all(node.childNodes[i]);
		}
	}
	else
	{
		fireClickByNode(node);
	}
}
if(automode){next_lesson();}
window.setTimeout(next_act, 660000);//Passe par défaut à l'activité suivante au bout de 11 minutes
detect_activity();
