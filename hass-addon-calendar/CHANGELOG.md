# Changelog

## 0.201 | 2022-05-16
- compatibility-fix in config for latest Home Asistant version

## 0.200 | 2022-04-02
This upgrade has BREAKING CHANGES because of the new configuration options.
Upon upgrading make sure to update your config according to the DOCS before restarting the addon.

Incorporated @cellerich's improvements:
- compatibility with baikal caldav 
- use proper async javascript syntax
- extra configuration options: number of days to query + query frequency can now be set as options in stead of the fixed values that were set earlier, read the docs.md for more information on how to configure

## 0.109 | 2022-02-01
- start- and end-month are available in 2-digit format now as well
- bumped dependencies