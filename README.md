# Notion to Hayagriva

A simple CLI to convert literature entries from Notion to the Hayagriva YAML file format for bibliographies. The tool automates the conversion process, saving time for users.  
 
Learn more about the Hayagriva YAML file format at their [documentation](https://github.com/typst/hayagriva/blob/main/docs/file-format.md).  
This project is inspired by [notion-scholar](https://github.com/thomashirtz/notion-scholar), but works the other way round. 

## Installation

> Notion-to-Hayagriva requires [Node.js](https://nodejs.org/en/) to be installed on your machine.

Download the repository and install the dependencies using the following commands:

```bash	
npm init using Importantus/notion-to-hayagriva notion-to-hayagriva
```

```bash
cd notion-to-hayagriva
npm install
```

## Setting up

### 1. Creation of a notion database
You can either duplicate the page template using the link below, or create a new database with the properties listed in requirements.

**Template**

[Link to the template](https://importantus.notion.site/Bibliografie-2175c98af72a4bd4837f35194d96bfa6)

**Requirements**
> If you you want to use different property names, you need to change the `values` Array in `index.js`.

The properties necessary to import publications in a database are the following:

| Property Name | Property Type |
| ------------- | ------------- |
| Title         | Title         |
| Key           | Text          |
| Type          | Select        |
| Autoren       | Relation      |
| Datum         | Date          |
| URL           | URL           |
| Abrufdatum    | Date          |
| DOI           | Text          |
| ISBN          | Text          |
| ISSN          | Text          |
| Verlag        | Text          |
| Organsiation  | Text          |
| Ort           | Text          |
| Issue         | Number        |
| Volume        | Number        |
| Parent        | Relation      |

**No space or special sign should be in the names of the properties.**

### 2. Creation of an integration

Create an [integration](https://www.notion.so/my-integrations) for the notion-scholar database. The integration needs to target the workplace containing the publication database.

Option needed:
- [x] Internal Integration
- [x] Read content

Copy the `Internal Integration Token` for the step 4.

### 3. Share the database with the Integration

Go to your database in notion => Click on `...` (top right) => `+ Add connections` => Select the integration that you just created.

Copy the link of the database (simply the URL on a browser, on the application => Click on `...` => `Copy Link`) for the step 4.

It is the *database page* and not the dashboard page that needs to be integrated. 

### 4. Set the token and database_id in .env
Add an .env file in the root directory with the following content:

```
NOTION_TOKEN=your_token
NOTION_DB_ID=your_database_id
```

## Usage
After installation and setting up, you can use the tool to convert the entries in the database to the Hayagriva YAML file format.

```bash
node index.js
```

The output will be a file named `hayagriva.yml` in the root directory.