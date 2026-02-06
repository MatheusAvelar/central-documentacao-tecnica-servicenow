var GetInstanceScanResults = Class.create();
GetInstanceScanResults.prototype = Object.extendsObject(AbstractAjaxProcessor, {

    // Busca e exibe os Instance Scans
    runScan: function() {
        var updateSetName = this.getParameter('sysparm_update_set');

        var html = "";
        html += "<div id='instanceScanHtml' style='background:#f9f9f9;border:1px solid #ddd;border-radius:8px;padding:12px 16px;margin-bottom:20px;'>";
        html += "<h3 style='margin-top:0;color:#0d47a1;'>Instance Scan</h3>";
        html += "<p style='font-size:13px;color:#555;margin-bottom:10px;'>Clique no número do Scan para ver os Findings.</p>";

        html += "<table style='width:100%;border-collapse:collapse;font-size:14px;margin-top:10px;'>";
        html += "<tr style='background:#e7e7e7;color:#333;font-weight:bold;'>";
        html += "<th style='padding:8px;border:1px solid #ccc;'>Instance Scan</th>";
        html += "<th style='padding:8px;border:1px solid #ccc;'>Status</th>";
        html += "</tr>";

        // Buscar update set
        var us = new GlideRecord('sys_update_set');
        us.addQuery('name', 'IN', updateSetName);
        us.query();
        if (!us.next()) {
            html += "<tr><td colspan='2' style='text-align:center;padding:10px;color:#555;'>Update Set não encontrado</td></tr>";
            html += "</table></div>";
            return html;
        }

        var updateSetSysId = us.getUniqueValue();

        // Buscar targets
        var targets = [];
        var target = new GlideRecord('scan_target');
        target.addQuery('record_id', updateSetSysId);
        target.query();
        while (target.next()) targets.push(target.getUniqueValue());

        if (targets.length == 0) {
            html += "<tr><td colspan='2' style='text-align:center;padding:10px;'>Nenhum target encontrado.</td></tr>";
            html += "</table></div>";
            return html;
        }

        // Buscar combos
        var combos = [];
        var combo = new GlideRecord('scan_combo');
        combo.addQuery('targets', 'IN', targets);
        combo.query();
        while (combo.next()) combos.push(combo.getUniqueValue());

        // Buscar resultados
        var scan = new GlideRecord('scan_result');
        scan.addQuery('combo', 'IN', combos);
		scan.orderByDesc("number");
        scan.query();

        while (scan.next()) {

            // verificar findings
            var finding = new GlideRecord("scan_finding");
            finding.addQuery("result", scan.getUniqueValue());
            finding.setLimit(1);
            finding.query();

            var hasFindings = finding.hasNext();
            var statusText = hasFindings ? "failed" : "complete";
            var statusColor = hasFindings ? "#F44336" : "#4CAF50";

            html += "<tr>";
            html += "<td style='padding:8px;border:1px solid #ccc;'>" +
                "<a href='javascript:void(0);' onclick=\"showFindings('" + scan.getUniqueValue() + "')\" " +
                "style='color:#0d47a1;font-weight:bold;text-decoration:none;'>" +
                scan.number +
                "</a></td>";
            html += "<td style='padding:8px;border:1px solid #ccc;font-weight:bold;color:" + statusColor + ";'>" + statusText + "</td>";
            html += "</tr>";
        }

        html += "</table>";
        html += "<div id='findingDetails'></div>"; // container da tabela de findings
        html += "</div>";

        return html;
    },

	// Busca e exibe os Findings
    getFindings: function() {

        var scanId = this.getParameter("sysparm_scan_id");

        var html = "";
        html += "<div style='margin-top:20px;background:#ffffff;border:1px solid #ddd;border-radius:8px;padding:12px;'>"
        html += "<h3 style='color:#0d47a1;margin-top:0;'>Findings</h3>";

        var f = new GlideRecord("scan_finding");
        f.addQuery("result", scanId);
        f.query();

        if (!f.hasNext()) {
            html += "<p style='color:#555;font-size:13px;'>Nenhum finding encontrado para este scan.</p>";
            html += "</div>";
            return html;
        }

        // =============================
        // CONTAGEM DE FINDINGS
        // =============================
        var total = 0;
        while (f.next()) total++;
        f.reset();
        f.query();

        html += `<p style='margin-top:-5px;font-size:13px;color:#444;'>${total} findings encontrados</p>`;

        html += "<table style='width:100%;border-collapse:collapse;font-size:14px;margin-top:10px;'>"
        html += "<tr style='background:#e7e7e7;font-weight:bold;'>";
        html += "<th style='padding:8px;border:1px solid #ccc;'>Severidade</th>";
        html += "<th style='padding:8px;border:1px solid #ccc;'>Check</th>";
        html += "<th style='padding:8px;border:1px solid #ccc;'>Fonte</th>";
        html += "<th style='padding:8px;border:1px solid #ccc;'>Detalhes</th>";
        html += "<th style='padding:8px;border:1px solid #ccc;'>Abrir</th>";
        html += "</tr>";

        while (f.next()) {

            // =============================
            // MAPEAR PRIORIDADE (1–4)
            // =============================
            var p = (f.check.priority + "") || "";
            var severity = "Undefined";
            var color = "#777";

            switch (p) {
                case "1":
                    severity = "Critical";
                    color = "#b71c1c"; // vermelho forte
                    break;
                case "2":
                    severity = "High";
                    color = "#e53935"; // vermelho
                    break;
                case "3":
                    severity = "Moderate";
                    color = "#fb8c00"; // laranja
                    break;
                case "4":
                    severity = "Low";
                    color = "#43a047"; // verde
                    break;
            }

            var details = f.finding_details || "—";

            html += "<tr>";

            // =======================================
            // SEVERIDADE COLORIDA
            // =======================================
            html += `
            <td style="padding:8px;border:1px solid #ccc;font-weight:bold;color:${color};">
                ${severity}
            </td>
        `;

            // =======================================
            // CHECK + DESCRIÇÃO
            // =======================================
            html += `
            <td style="padding:8px;border:1px solid #ccc;">
                <b>${f.check.getDisplayValue()}</b><br>
                <small style="color:#666;">${f.check.description || ""}</small>
            </td>
        `;

            // =======================================
            // FONTE
            // =======================================
            html += `
            <td style="padding:8px;border:1px solid #ccc;">
                ${f.source.getDisplayValue()}
            </td>
        `;

            // =======================================
            // DETALHES (EXPAND / CONTRAIR)
            // =======================================
            html += `
            <td style="padding:8px;border:1px solid #ccc;">
                <details>
                    <summary style="cursor:pointer;color:#0d47a1;">Ver detalhes</summary>
                    <div style="margin-top:5px;color:#444;">
                        <pre style="white-space:pre-wrap;">${details}</pre>
                    </div>
                </details>
            </td>
        `;

            // =======================================
            // LINK PARA REGISTRO REAL
            // =======================================
            html += `
            <td style="padding:8px;border:1px solid #ccc;text-align:center;">
                <a href="/nav_to.do?uri=scan_finding.do?sys_id=${f.getUniqueValue()}"
                   target="_blank"
                   style="color:#673ab7;font-weight:bold;text-decoration:none;">
                   Abrir
                </a>
            </td>
        `;

            html += "</tr>";
        }

        html += "</table></div>";
        return html;
    },

    type: "GetInstanceScanResults"
});