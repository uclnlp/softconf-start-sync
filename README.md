# Softconf START sync, tool for Google Sheets

Softconf START sync is a tool for Google Sheets which helps conference area chairs sync their data with [Softconf START](https://www.softconf.com/) quickly and effectively.

# Usage help

The help for using this tool is to be found on this page:

> https://github.com/uclmr/softconf-start-sync

You can report issues with the tool to Github issues of the project here:

> https://github.com/uclmr/softconf-start-sync/issues

The tool relies on Softconf's ability to export area data as web service. Through this, it enables area chairs to:
- Import data to Google Sheets (see First Run)
- Construct links to papers, PDFs, discussions and reviews
- Subsequent updates of data, where the tool updates only columns found in the original data, prefixed with ‘%’, and colors the updated values in blue, so you can see what changed since the last update

The easiest way to start working with the tool is to:
- install it :)
- set it up
- run it for the first time
- do subsequent updates


## Installation

Install the tool from the following URL:

> https://chrome.google.com/webstore/detail/softconf-start-sync/kjbckhokbhhnhimelcfjcajiejbmbcnc

## Setup

After installing the tool, you will get the ``Softconf START sync`` menu under your Add-ons menu, with ``Setup``, ``Sync with START`` and ``Help`` submenus, as shown on the following screenshot:

![Softconf START sync menu screenshot](https://github.com/uclmr/softconf-start-sync/blob/master/img/softconf_sync_menu.png "Softconf START sync menu")

First, run the ``Setup`` to open up the Setup sidebar where you need to enter two URLs, the **Reports URL** and the **Base URL**.

The **Reports URL** looks something like this:

> https://www.softconf.com/conference/shortpapers/cgi-bin/scmd.cgi?scmd=webservice&token=SECRET_TOKEN

and it is URL you will get from Softconf upon exporting the START data as a service. We explain the procedure of obtaining this URL in the next subsection.

**Base URL** is a base of the track URL, something like:

> https://www.softconf.com/eacl2017/shortpapers/track/Information_extraction_Text_mining_Question_answering/

This URL is used to generate URLs to papers, PDFs, discussions and reviews.

## Exporting Softconf START data as a service


TBD



## First sync

Upon entering the ``Reports URL`` and ``Base URL`` in the ``Setup`` section, you're ready to run ``Sync with START`` for the first time.
We recommend to start with an empty sheet, as the tool recognises running it on an empty sheet, and populates it with all the report data.

Upon the first run, the tool will create the header
containing all the variables from the imported report, starting with ``%``, e.g. `Submission ID` becomes `%SubmissionID`.
It is important to know that the tool will later update ONLY such variables (starting with ``%``), so be careful not to change those column names.

After the first run, you will have the complete reports file imported, together with four additional columns:
- ``%Paper URL``
- ``%PDF URL``
- ``%Discussion URL``
- ``%Reviews URL``
which are generated from the ``Base URL`` and the appropriate ``Submission ID``

![Softconf START sync first run screenshot](https://github.com/uclmr/softconf-start-sync/blob/master/img/softconf_sync_first_run.png "Softconf START sync first run")

From this moment on, you're free to remove any unnecessary columns, and add your custom columns.
Bare in mind that:
- the minimum expected column is ``%Submission ID`` and the system will complain if one is not found.
- only columns whose names start with ``%`` will be updated with the corresponding column name from the START web service

## Subsequent syncs 

After the first sync, you're free to change the data however you wish (add and delete columns, change values, add and remove rows).

Subsequent runs of ``Sync with START`` ensure that the data in the spreadsheet is synchronised with the data from the service, particularly:
- ONLY columns in the spreadsheet, whose names start with ``%``, will be updated with the corresponding column name from the START web service (deleted or missing columns won't be fetched)
- the tool will fetch and update ONLY changed values, and color them blue, as can be seen in the following screenshot:
- any deleted and/or ignored rows (papers) will be re-added at the end of the spreadsheet

![Softconf START sync update screenshot](https://github.com/uclmr/softconf-start-sync/blob/master/img/softconf_sync_update.png "Softconf START sync update")
