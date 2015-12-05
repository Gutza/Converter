if (MCE!=undefined) {
	if (
		MCE.applicationName==undefined ||
		MCE.applicationName!="Converter"
	) {
		alert("Converter: global variable MCE is already used!");
	}
} else {
	var MCE = {
		applicationName: "Converter",
		applicationVersion: "1.2.6",
		installMode: 'local',
		finishedLoading: false
	}
}
