function ReprovarRevisao() {
    if (confirm("Tem certeza que deseja reprovar a revisão?")) {
		gsftSubmit(null, g_form.getFormElement(), "reprovar_revisao");
	} else {
		return false;
	}
}

if (typeof window == 'undefined')
    setRedirect();

function setRedirect() {
    reprovarRevisao();
}

function reprovarRevisao(){
	try {
		var service = new CDT_FluxoService();
		var msg = service.reprovarRevisao(current); // muda status para correcao_requerida
		gs.addInfoMessage(msg);
		action.setRedirectURL(current);
	} catch(e) {
		gs.addErrorMessage('Erro ao reprovar revisão: ' + e.message);
		gs.error(e);
		action.setRedirectURL(current);
	}
}