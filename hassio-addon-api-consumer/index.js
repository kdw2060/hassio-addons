// This file only serves to load the various api consumers.
// Upload your consumers to the /share/consumers folder and define your consumers in the consumerList option by listing their filename minus the .js
import axios from "axios";
import cron from 'node-cron';
import moment from 'moment';
import { consumerList } from "./options";

for (let i = 0 ; i < consumerList.length; i++) {
   require('/share/consumers/' + consumerList[i]);
 }