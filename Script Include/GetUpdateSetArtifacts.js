var GetUpdateSetArtifacts = Class.create();
GetUpdateSetArtifacts.prototype = Object.extendsObject(AbstractAjaxProcessor, {

    getArtifacts: function() {
        var instanceUrl = gs.getProperty('doc.uri');

        var updates = this.getParameter('sysparm_updates') || '';
        var updatesArr = updates.split(/\s*,\s*/).map(function(u) {
            return u.trim();
        });

        var notTypes = this.getParameter('sysparm_notTypes') || '';
        var notTypesArr = notTypes.split(/\s*,\s*/).map(function(u) {
            return u.trim();
        });

        var types = this.getParameter('sysparm_types') || '';
        var typesArr = types.split(/\s*,\s*/).map(function(u) {
            return u.trim();
        });

        var application = this.getParameter('sysparm_application') || '';
        var applicationArr = application.split(/\s*,\s*/).map(function(u) {
            return u.trim();
        });

        var result = [];
        var gr = new GlideRecord('sys_update_xml');
        gr.addQuery('update_set.name', 'IN', updatesArr);
        this.getParameter('sysparm_types') ? gr.addQuery('type', 'IN', typesArr) : '';
        this.getParameter('sysparm_notTypes') ? gr.addQuery('type', 'NOT IN', notTypesArr) : '';
        this.getParameter('sysparm_application') ? gr.addQuery('application', 'IN', applicationArr) : '';
        gr.query();

        var total = gr.getRowCount();

        while (gr.next()) {
            var link = "";
            var nameMatch = gr.name.match(/^(.*)_([0-9a-f]{32})$/i);
            if (nameMatch) link = instanceUrl + nameMatch[1] + ".do?sys_id=" + nameMatch[2];

            // Verifica se já existe review salvo
            var review = new GlideRecord('u_code_review_artifact');
            var passou = false;
            var naoPassou = false;
            var comentario = '';
            if (review.get('u_link_do_artefato', link)) {
                passou = (review.u_passou_no_review == true || review.u_passou_no_review == 'true' || review.u_passou_no_review == '1');
                naoPassou = (review.u_nao_passou_no_review == true || review.u_nao_passou_no_review == 'true' || review.u_nao_passou_no_review == '1');
                comentario = review.u_comentario ? review.u_comentario.getDisplayValue() : '';
            }

            result.push({
                name: gr.target_name.toString() || "Não informado",
                link: (link !== '' ? link : "Não informado"),
                type: gr.type.toString() || "Não informado",
                updateSet: gr.update_set.name.toString() || "Não informado",
                application: gr.application.name.toString() || "Não informado",
                action: gr.action.toString() || "Não informado",
                totalCount: total.toString(),
                passou: passou,
                naoPassou: naoPassou,
                comentario: comentario
            });
        }

        return JSON.stringify(result);
    },

    saveReview: function() {

        var data = this.getParameter('sysparm_data');
        gs.info("[CodeReview] sysparm_data recebido: " + data);

        if (!data) {
            gs.error("[CodeReview] Nenhum dado recebido");
            return "Nenhum dado recebido";
        }

        try {

            var parsedData = JSON.parse(data);

            if (!parsedData || parsedData.length === 0)
                return "Lista vazia";

            var updateSet = parsedData[0].updateSet;

            var codeReviewSysId = this.getCodeReviewByUpdateSet(updateSet);

            parsedData.forEach(function(item, index) {

                if (!item.link)
                    return;

                var gr = new GlideRecord('u_code_review_artifact');
                gr.addQuery('u_nome_do_update_set', item.updateSet);
                gr.addQuery('u_link_do_artefato', item.link);
                gr.query();

				gs.log(gr.getEncodedQuery());

                // ========================
                // UPDATE
                // ========================
                if (gr.next()) {

                    gr.u_code_review = codeReviewSysId;
                    gr.u_nome_do_artefato_target_name = item.name;
                    gr.u_action_do_artefato = item.action;
                    gr.u_tipo_de_artefato = item.type;
                    gr.u_nome_do_update_set = item.updateSet;
                    gr.u_nome_da_aplicacao = item.application;
                    gr.u_passou_no_review = item.passou;
                    gr.u_nao_passou_no_review = item.naoPassou;
                    gr.u_comentario = item.comentario;

                    gr.update();

                }
                // ========================
                // INSERT
                // ========================
                else {

                    gr.initialize();

                    gr.u_code_review = codeReviewSysId;
                    gr.u_link_do_artefato = item.link;
                    gr.u_nome_do_artefato_target_name = item.name;
                    gr.u_action_do_artefato = item.action;
                    gr.u_tipo_de_artefato = item.type;
                    gr.u_nome_do_update_set = item.updateSet;
                    gr.u_nome_da_aplicacao = item.application;
                    gr.u_passou_no_review = item.passou;
                    gr.u_nao_passou_no_review = item.naoPassou;
                    gr.u_comentario = item.comentario;

                    gr.insert();
                }

            });

            return "Reviews salvos/atualizados com sucesso!";

        } catch (e) {

            gs.error("[CodeReview] Erro: " + e.message);
            return "Erro ao salvar: " + e.message;
        }
    },

    getCodeReviewByUpdateSet: function(updateSet) {

        var updateSetSysId = this.convertNamexSysIdUpdateSet(updateSet);

        if (!updateSetSysId) {
            gs.warn('[CodeReview] Update Set não encontrado: ' + updateSet);
            return '';
        }

        var cr = new GlideRecord('u_code_review');
        cr.addQuery('u_update_set', updateSetSysId);
        cr.query();

        if (cr.next()) {
            gs.info('[CodeReview] Code Review encontrado: ' + cr.getUniqueValue());
            return cr.getUniqueValue();
        }

        gs.warn('[CodeReview] Nenhum Code Review encontrado para Update Set: ' + updateSetSysId);
        return '';
    },

    convertNamexSysIdUpdateSet: function(name) {
        var gr = new GlideRecord('sys_update_set');
        gr.addQuery('name', name);
        gr.setLimit(1);
        gr.query();

        if (gr.next()) {
            return gr.sys_id.toString();
        }

        return '';
    },


    type: 'GetUpdateSetArtifacts'
});