var erros = [];

/* =====================================================
   DOCUMENTAÇÃO - ANEXOS
===================================================== */
var att = new GlideAggregate('sys_attachment');
att.addQuery('table_name', current.getTableName());
att.addQuery('table_sys_id', current.sys_id);
att.addAggregate('COUNT');
att.query();
att.next();

var totalAnexos = parseInt(att.getAggregate('COUNT'), 10);

if (totalAnexos === 0) {
    erros.push('• Adicione pelo menos uma evidência (anexo) na documentação.');
}


/* =====================================================
   CODE REVIEW FINALIZADO
===================================================== */
/*var cr = new GlideRecord('u_code_review');
cr.orderByDesc('sys_created_on');
cr.query();

if (!cr.next()) {

    erros.push('• Code Review não encontrado.');

} else if (cr.u_status != 'finalizado') {

    erros.push('• Code Review ainda não está finalizado.');

}
*/

/* =====================================================
   INSTANCE SCAN SEM FINDINGS
===================================================== */
/*var scan = new GlideRecord('scan_result');
scan.orderByDesc('sys_created_on');
scan.query();

if (!scan.next()) {

    erros.push('• Nenhum Instance Scan encontrado.');

} else if (parseInt(scan.finding_count, 10) > 0) {

    erros.push('• Instance Scan possui findings pendentes.');

}*/


/* =====================================================
   DECISÃO FINAL
===================================================== */

if (erros.length > 0) {

    var mensagem = 'Não é possível aprovar a Documentação Técnica:<br><br>' + erros.join('<br> ');

    gs.addErrorMessage(mensagem);

} else {

    current.u_status = 'aprovado';
    current.update();

    gs.addInfoMessage('Documentação Técnica finalizada com sucesso!');
}

action.setRedirectURL(current);
