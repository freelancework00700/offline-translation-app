#android  
-> capacitor-mlkit-translation -> java -> Translation 
replace this line with below line 
old : DownloadConditions conditions = new DownloadConditions.Builder().requireWifi().build();
new : DownloadConditions conditions = new DownloadConditions.Builder().build();

