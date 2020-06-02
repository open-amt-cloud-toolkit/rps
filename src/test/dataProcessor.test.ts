/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Author: Madhavi Losetty
 **********************************************************************/
import { v4 as uuid } from 'uuid';

import Logger from "../Logger";
import { config } from "./helper/Config";
import { Validator } from "../Validator";
import { NodeForge } from "../NodeForge";
import { CertManager } from "../CertManager";
import { Configurator } from "../Configurator";
import { WSManProcessor } from "../WSManProcessor";
import { ClientManager } from "../ClientManager";
import { DataProcessor } from "../DataProcessor";
import { SignatureHelper } from "../utils/SignatureHelper";
import { ClientResponseMsg } from "../utils/ClientResponseMsg";
import { EnvReader } from '../utils/EnvReader';

EnvReader.InitFromEnv(config);

let nodeForge = new NodeForge();
let helper = new SignatureHelper(nodeForge);
let certManager = new CertManager(nodeForge);
let configurator = new Configurator();
let clientManager = ClientManager.getInstance(Logger("ClientManager"));
let responseMsg = new ClientResponseMsg(Logger("ClientResponseMsg"), nodeForge);
let amtwsman = new WSManProcessor(Logger(`AMTWSMan`), clientManager, responseMsg);
let validator = new Validator(Logger("Validator"), configurator, clientManager, nodeForge);
let dataProcessor = new DataProcessor(Logger(`DataProcessor`), helper, configurator, validator, certManager, clientManager, responseMsg, amtwsman);

describe("process client data", () => {
  test("Should return an error with activation message and junk payload", async () => {
    let msg = `{\"apiKey\":\"key\",\"appVersion\":\"1.0.0\",\"message\":\"all's good!\",\"method\":\"activation\",\"payload\":\"SFRUUC8xLjEgNDAxIFVuYXV0aG9yaXplZA0KV1dXLUF1dGhlbnRpY2F0ZTogRGlnZXN0IHJlYWxtPSJEaWdlc3Q6QTQwNzAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAiLCBub25jZT0id2xiRUsxRXRBQUFBQUFBQVdXNWFVSEZwK21RUTFqNjMiLHN0YWxlPSJmYWxzZSIscW9wPSJhdXRoIg0KQ29udGVudC1UeXBlOiB0ZXh0L2h0bWwNClNlcnZlcjogSW50ZWwoUikgQWN0aXZlIE1hbmFnZW1lbnQgVGVjaG5vbG9neSAxMS44LjUwLjM0MjUNCkNvbnRlbnQtTGVuZ3RoOiA2OTANCkNvbm5lY3Rpb246IGNsb3NlDQoNCjwhRE9DVFlQRSBIVE1MIFBVQkxJQyAiLS8vVzNDLy9EVEQgSFRNTCA0LjAxIFRyYW5zaXRpb25hbC8vRU4iID4KPGh0bWw+PGhlYWQ+PGxpbmsgcmVsPXN0eWxlc2hlZXQgaHJlZj0vc3R5bGVzLmNzcz4KPG1ldGEgaHR0cC1lcXVpdj0iQ29udGVudC1UeXBlIiBjb250ZW50PSJ0ZXh0L2h0bWw7IGNoYXJzZXQ9dXRmLTgiPgo8dGl0bGU+SW50ZWwmcmVnOyBBY3RpdmUgTWFuYWdlbWVudCBUZWNobm9sb2d5PC90aXRsZT48L2hlYWQ+Cjxib2R5Pgo8dGFibGUgY2xhc3M9aGVhZGVyPgo8dHI+PHRkIHZhbGlnbj10b3Agbm93cmFwPgo8cCBjbGFzcz10b3AxPkludGVsPGZvbnQgY2xhc3M9cj48c3VwPiZyZWc7PC9zdXA+PC9mb250PiBBY3RpdmUgTWFuYWdlbWVudCBUZWNobm9sb2d5Cjx0ZCB2YWxpZ249InRvcCI+PGltZyBzcmM9ImxvZ28uZ2lmIiBhbGlnbj0icmlnaHQiIGFsdD0iSW50ZWwiPgo8L3RhYmxlPgo8YnIgLz4KPGgyIGNsYXNzPXdhcm4+TG9nIG9uIGZhaWxlZC4gSW5jb3JyZWN0IHVzZXIgbmFtZSBvciBwYXNzd29yZCwgb3IgdXNlciBhY2NvdW50IHRlbXBvcmFyaWx5IGxvY2tlZC48L2gyPgoKPHA+Cjxmb3JtIE1FVEhPRD0iR0VUIiBhY3Rpb249ImluZGV4Lmh0bSI\",\"protocolVersion\":\"2.0.0\",\"status\":\"ok\"}`;
    let clientId = uuid();
    clientManager.addClient({ ClientId: clientId, ClientSocket: null });
    let clientMsg = await dataProcessor.processData(msg, clientId);
    expect(clientMsg.message).toContain(`Error: Failed to parse client message payload.`);
  });
  
  test("Should return an error with activation message and missing mandatory data in payload.", async () => {
    let clientMsg =
      '{"apiKey":"key","appVersion":"1.0.0","message":"all\'s good!","method":"activation","payload":"ewogICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAiYnVpbGQiOiAiMzQyNSIsCiAgICAgICAgICAgICAgICAiZnFkbiI6ICJ2cHJvZGVtby5jb20iLAogICAgICAgICAgICAgICAgInBhc3N3b3JkIjogIktRR25IK041cUo4WUxxakVGSk1uR1NnY25GTE12MFRrIiwKICAgICAgICAgICAgICAgICJjdXJyZW50TW9kZSI6IDAsCiAgICAgICAgICAgICAgICAiY2VydEhhc2hlcyI6IFsKICAgICAgICAgICAgICAgICAgICAgICAgImU3Njg1NjM0ZWZhY2Y2OWFjZTkzOWE2YjI1NWI3YjRmYWJlZjQyOTM1YjUwYTI2NWFjYjVjYjYwMjdlNDRlNzAiLAogICAgICAgICAgICAgICAgICAgICAgICAiZWIwNGNmNWViMWYzOWFmYTc2MmYyYmIxMjBmMjk2Y2JhNTIwYzFiOTdkYjE1ODk1NjViODFjYjlhMTdiNzI0NCIsCiAgICAgICAgICAgICAgICAgICAgICAgICJjMzg0NmJmMjRiOWU5M2NhNjQyNzRjMGVjNjdjMWVjYzVlMDI0ZmZjYWNkMmQ3NDAxOTM1MGU4MWZlNTQ2YWU0IiwKICAgICAgICAgICAgICAgICAgICAgICAgImQ3YTdhMGZiNWQ3ZTI3MzFkNzcxZTk0ODRlYmNkZWY3MWQ1ZjBjM2UwYTI5NDg3ODJiYzgzZWUwZWE2OTllZjQiLAogICAgICAgICAgICAgICAgICAgICAgICAiMTQ2NWZhMjA1Mzk3Yjg3NmZhYTZmMGE5OTU4ZTU1OTBlNDBmY2M3ZmFhNGZiN2MyYzg2Nzc1MjFmYjVmYjY1OCIsCiAgICAgICAgICAgICAgICAgICAgICAgICI4M2NlM2MxMjI5Njg4YTU5M2Q0ODVmODE5NzNjMGY5MTk1NDMxZWRhMzdjYzVlMzY0MzBlNzljN2E4ODg2MzhiIiwKICAgICAgICAgICAgICAgICAgICAgICAgImE0YjZiMzk5NmZjMmYzMDZiM2ZkODY4MWJkNjM0MTNkOGM1MDA5Y2M0ZmEzMjljMmNjZjBlMmZhMWIxNDAzMDUiLAogICAgICAgICAgICAgICAgICAgICAgICAiOWFjZmFiN2U0M2M4ZDg4MGQwNmIyNjJhOTRkZWVlZTRiNDY1OTk4OWMzZDBjYWYxOWJhZjY0MDVlNDFhYjdkZiIsCiAgICAgICAgICAgICAgICAgICAgICAgICJhNTMxMjUxODhkMjExMGFhOTY0YjAyYzdiN2M2ZGEzMjAzMTcwODk0ZTVmYjcxZmZmYjY2NjdkNWU2ODEwYTM2IiwKICAgICAgICAgICAgICAgICAgICAgICAgIjE2YWY1N2E5ZjY3NmIwYWIxMjYwOTVhYTVlYmFkZWYyMmFiMzExMTlkNjQ0YWM5NWNkNGI5M2RiZjNmMjZhZWIiLAogICAgICAgICAgICAgICAgICAgICAgICAiOTYwYWRmMDA2M2U5NjM1Njc1MGMyOTY1ZGQwYTA4NjdkYTBiOWNiZDZlNzc3MTRhZWFmYjIzNDlhYjM5M2RhMyIsCiAgICAgICAgICAgICAgICAgICAgICAgICI2OGFkNTA5MDliMDQzNjNjNjA1ZWYxMzU4MWE5MzlmZjJjOTYzNzJlM2YxMjMyNWIwYTY4NjFlMWQ1OWY2NjAzIiwKICAgICAgICAgICAgICAgICAgICAgICAgIjZkYzQ3MTcyZTAxY2JjYjBiZjYyNTgwZDg5NWZlMmI4YWM5YWQ0Zjg3MzgwMWUwYzEwYjljODM3ZDIxZWIxNzciLAogICAgICAgICAgICAgICAgICAgICAgICAiNzNjMTc2NDM0ZjFiYzZkNWFkZjQ1YjBlNzZlNzI3Mjg3YzhkZTU3NjE2YzFlNmU2MTQxYTJiMmNiYzdkOGU0YyIsCiAgICAgICAgICAgICAgICAgICAgICAgICIyMzk5NTYxMTI3YTU3MTI1ZGU4Y2VmZWE2MTBkZGYyZmEwNzhiNWM4MDY3ZjRlODI4MjkwYmZiODYwZTg0YjNjIiwKICAgICAgICAgICAgICAgICAgICAgICAgIjQ1MTQwYjMyNDdlYjljYzhjNWI0ZjBkN2I1MzA5MWY3MzI5MjA4OWU2ZTVhNjNlMjc0OWRkM2FjYTkxOThlZGEiLAogICAgICAgICAgICAgICAgICAgICAgICAiNDNkZjU3NzRiMDNlN2ZlZjVmZTQwZDkzMWE3YmVkZjFiYjJlNmI0MjczOGM0ZTZkMzg0MTEwM2QzYWE3ZjMzOSIsCiAgICAgICAgICAgICAgICAgICAgICAgICIyY2UxY2IwYmY5ZDJmOWUxMDI5OTNmYmUyMTUxNTJjM2IyZGQwY2FiZGUxYzY4ZTUzMTliODM5MTU0ZGJiN2Y1IiwKICAgICAgICAgICAgICAgICAgICAgICAgIjcwYTczZjdmMzc2YjYwMDc0MjQ4OTA0NTM0YjExNDgyZDViZjBlNjk4ZWNjNDk4ZGY1MjU3N2ViZjJlOTNiOWEiCiAgICAgICAgICAgICAgICBdLAogICAgICAgICAgICAgICAgInNrdSI6ICIxNjM5MiIsCiAgICAgICAgICAgICAgICAidXVpZCI6ICI0YmFjOTUxMC0wNGE2LTQzMjEtYmFlMi1kNDVkZGYwN2I2ODQiLAogICAgICAgICAgICAgICAgInVzZXJuYW1lIjogIiQkT3NBZG1pbiIsCiAgICAgICAgICAgICAgICAiY2xpZW50IjogIlBQQyIsCiAgICAgICAgICAgICAgICAicHJvZmlsZSI6ICJwcm9maWxlMSIKICAgICAgICB9","protocolVersion":"2.0.0","status":"ok"}';
    let clientId = uuid();
    clientManager.addClient({ ClientId: clientId, ClientSocket: null });
    let responseMsg = await dataProcessor.processData(clientMsg, clientId);
    expect(responseMsg.message).toEqual("Error: Invalid payload from client");
  });

  it("should return an error when message method is invalid and has a activation payload", async () => {
    let clientMsg = `{\"apiKey\":\"key\",\"appVersion\":\"1.0.0\",\"message\":\"all's good!\",\"method\":\"unknown\",\"payload\":\"eyJidWlsZCI6IjM0MjUiLCJjZXJ0SGFzaGVzIjpbImU3Njg1NjM0ZWZhY2Y2OWFjZTkzOWE2YjI1NWI3YjRmYWJlZjQyOTM1YjUwYTI2NWFjYjVjYjYwMjdlNDRlNzAiLCJlYjA0Y2Y1ZWIxZjM5YWZhNzYyZjJiYjEyMGYyOTZjYmE1MjBjMWI5N2RiMTU4OTU2NWI4MWNiOWExN2I3MjQ0IiwiYzM4NDZiZjI0YjllOTNjYTY0Mjc0YzBlYzY3YzFlY2M1ZTAyNGZmY2FjZDJkNzQwMTkzNTBlODFmZTU0NmFlNCIsImQ3YTdhMGZiNWQ3ZTI3MzFkNzcxZTk0ODRlYmNkZWY3MWQ1ZjBjM2UwYTI5NDg3ODJiYzgzZWUwZWE2OTllZjQiLCIxNDY1ZmEyMDUzOTdiODc2ZmFhNmYwYTk5NThlNTU5MGU0MGZjYzdmYWE0ZmI3YzJjODY3NzUyMWZiNWZiNjU4IiwiODNjZTNjMTIyOTY4OGE1OTNkNDg1ZjgxOTczYzBmOTE5NTQzMWVkYTM3Y2M1ZTM2NDMwZTc5YzdhODg4NjM4YiIsImE0YjZiMzk5NmZjMmYzMDZiM2ZkODY4MWJkNjM0MTNkOGM1MDA5Y2M0ZmEzMjljMmNjZjBlMmZhMWIxNDAzMDUiLCI5YWNmYWI3ZTQzYzhkODgwZDA2YjI2MmE5NGRlZWVlNGI0NjU5OTg5YzNkMGNhZjE5YmFmNjQwNWU0MWFiN2RmIiwiYTUzMTI1MTg4ZDIxMTBhYTk2NGIwMmM3YjdjNmRhMzIwMzE3MDg5NGU1ZmI3MWZmZmI2NjY3ZDVlNjgxMGEzNiIsIjE2YWY1N2E5ZjY3NmIwYWIxMjYwOTVhYTVlYmFkZWYyMmFiMzExMTlkNjQ0YWM5NWNkNGI5M2RiZjNmMjZhZWIiLCI5NjBhZGYwMDYzZTk2MzU2NzUwYzI5NjVkZDBhMDg2N2RhMGI5Y2JkNmU3NzcxNGFlYWZiMjM0OWFiMzkzZGEzIiwiNjhhZDUwOTA5YjA0MzYzYzYwNWVmMTM1ODFhOTM5ZmYyYzk2MzcyZTNmMTIzMjViMGE2ODYxZTFkNTlmNjYwMyIsIjZkYzQ3MTcyZTAxY2JjYjBiZjYyNTgwZDg5NWZlMmI4YWM5YWQ0Zjg3MzgwMWUwYzEwYjljODM3ZDIxZWIxNzciLCI3M2MxNzY0MzRmMWJjNmQ1YWRmNDViMGU3NmU3MjcyODdjOGRlNTc2MTZjMWU2ZTYxNDFhMmIyY2JjN2Q4ZTRjIiwiMjM5OTU2MTEyN2E1NzEyNWRlOGNlZmVhNjEwZGRmMmZhMDc4YjVjODA2N2Y0ZTgyODI5MGJmYjg2MGU4NGIzYyIsIjQ1MTQwYjMyNDdlYjljYzhjNWI0ZjBkN2I1MzA5MWY3MzI5MjA4OWU2ZTVhNjNlMjc0OWRkM2FjYTkxOThlZGEiLCI0M2RmNTc3NGIwM2U3ZmVmNWZlNDBkOTMxYTdiZWRmMWJiMmU2YjQyNzM4YzRlNmQzODQxMTAzZDNhYTdmMzM5IiwiMmNlMWNiMGJmOWQyZjllMTAyOTkzZmJlMjE1MTUyYzNiMmRkMGNhYmRlMWM2OGU1MzE5YjgzOTE1NGRiYjdmNSIsIjcwYTczZjdmMzc2YjYwMDc0MjQ4OTA0NTM0YjExNDgyZDViZjBlNjk4ZWNjNDk4ZGY1MjU3N2ViZjJlOTNiOWEiXSwiY2xpZW50IjoiUFBDIiwiY3VycmVudE1vZGUiOjAsImZxZG4iOiJ2cHJvZGVtby5jb20iLCJwYXNzd29yZCI6IktRR25IK041cUo4WUxxakVGSk1uR1NnY25GTE12MFRrIiwicHJvZmlsZSI6InByb2ZpbGUxIiwic2t1IjoiMTYzOTIiLCJ1c2VybmFtZSI6IiQkT3NBZG1pbiIsInV1aWQiOlsxNiwxNDksMTcyLDc1LDE2Niw0LDMzLDY3LDE4NiwyMjYsMjEyLDkzLDIyMyw3LDE4MiwxMzJdLCJ2ZXIiOiIxMS44LjUwIn0=\",\"protocolVersion\":\"2.0.0\",\"status\":\"ok\"}`;
    let clientId = uuid();
    clientManager.addClient({ ClientId: clientId, ClientSocket: null });
    let responseMsg = await dataProcessor.processData(clientMsg, clientId);
    expect(responseMsg.message).toContain(`Not a supported method received from AMT device`);
  });

  afterAll(() => {
    clientManager.clients = [];
  });
});
