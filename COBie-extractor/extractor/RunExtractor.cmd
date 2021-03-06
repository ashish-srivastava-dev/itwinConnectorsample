echo off

SET ARG=%1

IF NOT DEFINED ARG goto usage

IF %ARG%==--clean goto clean
IF %ARG%==--all goto all
IF %ARG%==--copy goto copyToConnector
goto usage

:all
	IF NOT DEFINED pythonCmd Set pythonCmd=python.exe
	echo extracting all
	IF NOT EXIST output mkdir output
	%pythonCmd% extractor.py input/COBieSampleSheetV1.xlsx output/intermediary_v1.db # create
	%pythonCmd% extractor.py input/COBieSampleSheetV2.xlsx output/intermediary_v2.db # data change
	%pythonCmd% extractor.py input/COBieSampleSheetV3.xlsx output/intermediary_v3.db # schema change (addition)
	%pythonCmd% extractor.py input/COBieSampleSheetV4.xlsx output/intermediary_v4.db # schema change (deletion)

goto end

:clean
	echo cleaning
	rmdir /s /q output
	del ..\..\COBie-connector\src\assets\*.db


goto end

:copyToConnector
echo copying databases from extractor output to connector assets
IF NOT EXIST ..\..\COBie-connector\src\assets mkdir ..\..\COBie-connector\src\assets
IF NOT EXIST ..\..\COBie-connector\src\output mkdir ..\..\COBie-connector\src\output
copy .\output\*.db  ..\..\COBie-connector\src\assets\
goto end

:usage
	echo RunExtractor usage
	echo -----------------------------
	echo RunExtractor "<option>"
	echo e.g. RunExtractor --all
	echo options:
	echo --all - extracts all sample sheets
	echo --clean - removes output from previous extractions
	echo --copy - copies databases from extractor output to connector assets
:end
	echo runextractor completed! 