var CDT_FluxoService = Class.create();
CDT_FluxoService.prototype = {

    initialize: function() {},

    /* =========================
       Funções de transição de status
    ========================= */
    
    concluirDocumentacao: function(record) {
        var erros = [];
        var att = new GlideAggregate('sys_attachment');
        att.addQuery('table_name', record.getTableName());
        att.addQuery('table_sys_id', record.sys_id);
        att.addAggregate('COUNT');
        att.query();
        att.next();
        var totalAnexos = parseInt(att.getAggregate('COUNT'), 10);

        if (totalAnexos === 0)
            erros.push('• Adicione pelo menos uma evidência (anexo) na documentação.');

        if (erros.length > 0) {
            throw new Error('Não é possível concluir documentação:<br><br>' + erros.join('<br> '));
        }

        record.u_status = 'documentacao_concluida';
        record.u_work_notes = 'Documentação concluída por ' + gs.getUserDisplayName();
        record.update();
        return 'Documentação concluída com sucesso! Notificação enviada para LT.';
    },

    aprovarRevisao: function(record) {
		var status = (record.u_status || '').toLowerCase();
        if (status !== 'documentacao_concluida')
            throw new Error('Somente registros com documentação concluída podem ser aprovados.');

        record.u_status = 'code_review_pronto';
        record.u_work_notes = 'Revisão aprovada pelo LT: ' + gs.getUserDisplayName();
        record.update();
        return 'Revisão aprovada com sucesso! Pronto para subida do Update Set.';
    },

    reprovarRevisao: function(record) {
		var status = (record.u_status || '').toLowerCase();
        if (status !== 'documentacao_concluida')
            throw new Error('Somente registros com documentação concluída podem ser reprovados.');

        record.u_status = 'correcao_requerida';
        record.u_work_notes = 'Revisão reprovada pelo LT: ' + gs.getUserDisplayName();
        record.update();
        return 'Revisão reprovada! Dev deve corrigir documentação ou código.';
    },

    iniciarSubida: function(record) {
		var status = (record.u_status || '').toLowerCase();
        if (status !== 'revisao_aprovada')
            throw new Error('Somente registros com revisão aprovada podem iniciar a subida.');

        record.u_status = 'code_review_pronto';
        record.u_work_notes = 'Subida iniciada pelo Analista de Release: ' + gs.getUserDisplayName();
        record.update();
        return 'Subida iniciada com sucesso.';
    },

    concluirSubida: function(record) {
		var status = (record.u_status || '').toLowerCase();
        if (status !== 'code_review_pronto')
            throw new Error('Somente registros com subida em andamento podem ser concluídos.');

        record.u_status = 'subida_concluida';
        record.u_work_notes = 'Update Set subiu em PRD: ' + gs.getUserDisplayName();
        record.update();
        return 'Subida concluída com sucesso.';
    },

};
