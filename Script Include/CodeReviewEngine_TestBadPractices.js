var CodeReviewEngine_TestBadPractices = Class.create();
CodeReviewEngine_TestBadPractices.prototype = {

    run: function () {
 
        // =========================
        // gs.print / gs.log
        // =========================
        gs.print('debugando');
        gs.log('teste');

        // =========================
        // eval
        // =========================
        eval('gs.info("eval executado")');

        // =========================
        // sys_id hardcoded
        // =========================
        var userId = "6816f79cc0a8016401c5a33be04be441";

        // =========================
        // GlideRecord sem filtro
        // =========================
        var gr = new GlideRecord('incident');
        gr.query();

        // =========================
        // updateMultiple sem filtro
        // =========================
        var upd = new GlideRecord('task');
        upd.updateMultiple();

        // =========================
        // insert sem initialize
        // =========================
        var badInsert = new GlideRecord('problem');
        badInsert.short_description = 'teste';
        badInsert.insert();

        // =========================
        // addQuery sys_id + next (deveria usar get)
        // =========================
        var byId = new GlideRecord('incident');
        byId.addQuery('sys_id', userId);
        byId.query();
        if (byId.next()) {
            gs.info(byId.number);
        }

        // =========================
        // current.update em estilo BR
        // =========================
        current.short_description = 'alterado';
        current.update();

        // =========================
        // setWorkflow(false) + update (ACL bypass)
        // =========================
        var bypass = new GlideRecord('task');
        bypass.get(userId);
        bypass.setWorkflow(false);
        bypass.short_description = 'bypass';
        bypass.update();

        // =========================
        // getParameter sem validação (GlideAjax style)
        // =========================
        var id = this.getParameter('sysparm_id');

        // =========================
        // gs.eventQueue desnecessário
        // =========================
        gs.eventQueue('custom.event', current, userId, 'payload');

        // =========================
        // query dentro de loop (performance ruim)
        // =========================
        while (gr.next()) {

            var inside = new GlideRecord('problem');
            inside.addQuery('active', true);
            inside.query();
        }

        // =========================
        // múltiplos addQuery (preferir encoded)
        // =========================
        var multi = new GlideRecord('incident');
        multi.addQuery('active', true);
        multi.addQuery('priority', 1);
        multi.addQuery('category', 'network');
        multi.query();

        // =========================
        // == null em vez de gs.nil
        // =========================
        if (multi.short_description == null) {
            gs.info('nulo');
        }

        // =========================
        // g_form.getValue repetido (client anti-pattern simulado)
        // =========================
        var a = g_form.getValue('short_description');
        var b = g_form.getValue('short_description');
        var c = g_form.getValue('short_description');
        var d = g_form.getValue('short_description');

        // =========================
        // muita complexidade / aninhamento
        // =========================
        if (true) {
            if (true) {
                if (true) {
                    if (true) {
                        if (true) {
                            gs.info('profundo demais');
                        }
                    }
                }
            }
        }

        // =========================
        // duplicação de código
        // =========================
        var tmp = new GlideRecord('task'); tmp.query();
        var tmp2 = new GlideRecord('task'); tmp2.query();

        // =========================
        // script gigante (encher linhas)
        // =========================
        for (var i = 0; i < 50; i++) {
            gs.info('linha dummy ' + i);
        }

        // =========================
        // sem try/catch proposital
        // =========================
        var x = 1 + 1;

        return "teste";
    },

	processar: function() {

        var gr = new GlideRecord('task');
        gr.query();

        if (gr.next()) {
            gs.log(gr.number);
        }
    },

    type: 'CodeReviewEngine_TestBadPractices'
};
