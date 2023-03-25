sap.ui.define(["sap/ui/core/format/NumberFormat"], function (NumberFormat) {
    "use strict";
    
    return {
    	colorChange : function(status){
    		if(	status === "Roteirizado_erro" ||
    			status === "ERRO_FILTRO_VIEW" ||
    			status === "OUTBOUND_ERRO" ||
    			status === "ERRO_PROCESS_CHAIN" ||
    			status === "ERRO_ORIGEM" || 
    			status === "PIVOTEADO_ERROR" ||
    			status === "FPSL_REGISTER" ||
    			status === "Integrado_Parcial" ||
    			status === "Registro_Incompleto" ||
    			status === "Item_erro"){
    			return "Error";
    		}
    		
    		if(	status === "not process" ||
    			status === "IN PROCESS" ||
    			status === "Aguardando_Fechamento" ||
    			status === "wait"){
    			return "Critical";
    		}
    		
    		if(	status === "FPSL_PROCESSADO" ||
    			status === "OUTBOUND_TRANSFERIDO" ||
    			status === "Registro_desconsiderado" ||
    			status === "Roteirizado"){
    			return "Good";
    		}
    	},
    	numberFormat: function(value){
    		
    		var oFormat = NumberFormat.getIntegerInstance({
				    "groupingEnabled": true,  
				    "groupingSeparator": '.', 
				    "groupingSize": 3         
				});
				
			return oFormat.format(value);	
				
    		
    	}
    };
});