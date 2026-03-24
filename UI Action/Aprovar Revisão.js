function AprovarRevisao() {
    if (confirm("Tem certeza que deseja aprovar a revisão?")) {
		gsftSubmit(null, g_form.getFormElement(), "aprovar_revisao");
	} else {
		return false;
	}
}

if (typeof window == 'undefined')
    setRedirect();

function setRedirect() {
    aprovarRevisao();
}

function aprovarRevisao(){
	try {
		var service = new CDT_FluxoService();
		var msg = service.aprovarRevisao(current); // muda status para revisao_aprovada
		gs.addInfoMessage(msg);
		action.setRedirectURL(current);
	} catch(e) {
		gs.addErrorMessage('Erro ao aprovar revisão: ' + e.message);
		gs.error(e);
		action.setRedirectURL(current);
	}
}