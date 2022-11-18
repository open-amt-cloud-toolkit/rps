/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

const TEST_PFXCERT: any = {
  certs: [
    {
      version: 2,
      serialNumber: '30321b4fa9a940af47a4fec8c37b7cc2',
      signatureOid: '1.2.840.113549.1.1.11',
      signature: '[ÚuiaºÏÑb£_U²°O\u0004ñåÃ[hD\u001c§Coe)úe\u0000èY\u0004åë¥\u001b\u0007\ft4²¶o4h@þüiS+cÌ¾jÙxor\u0012¥/¢FðäVE\f\u00163"lafj\u000f\u000f¨yþ\u0013¦Tãº\u0004\u0011Ú©ÎZD\u0003ëÞ-ãì÷ê+füø½îPó_Ô=Ù=Ü\u000eõ\rì$\u000f}H\u0010;GGòÚ\u000e\u001cKmÞ\u0007©ís\nm#,"/h1nÀ+ÔÑ ßÑX^\n\rº¯\u0011(Õ\u0002´sÚ¾SÂ/»\n±²\u000etÚÆ\u0000×\u0003¥\u000f\u0014©·ý¤´óò[\u001d\u0016nÒÈ¹P%\u0006J=oM\u001c\u0013w3×~a<N{\rËÊuý\u001c(\b,Ç',
      siginfo: {
        algorithmOid: '1.2.840.113549.1.1.11',
        parameters: {
        }
      },
      validity: {
        notBefore: '2019-08-13T16:17:32.000Z',
        notAfter: '2020-08-13T00:00:00.000Z'
      },
      issuer: {
        attributes: [
          {
            type: '2.5.4.3',
            value: 'bjosburn-desk1.amr.corp.intel.com',
            valueTagClass: 19,
            name: 'commonName',
            shortName: 'CN'
          }
        ],
        hash: 'cd4b813d3464f08aaac246fb109fb6ca9bf92d3d'
      },
      subject: {
        attributes: [
          {
            type: '2.5.4.3',
            value: 'bjosburn-desk1.amr.corp.intel.com',
            valueTagClass: 19,
            name: 'commonName',
            shortName: 'CN'
          }
        ],
        hash: 'cd4b813d3464f08aaac246fb109fb6ca9bf92d3d'
      },
      extensions: [
        {
          id: '2.5.29.15',
          critical: false,
          value: '\u0003\u0002\u00040',
          name: 'keyUsage',
          digitalSignature: false,
          nonRepudiation: false,
          keyEncipherment: true,
          dataEncipherment: true,
          keyAgreement: false,
          keyCertSign: false,
          cRLSign: false,
          encipherOnly: false,
          decipherOnly: false
        },
        {
          id: '2.5.29.37',
          critical: false,
          value: '0\n\u0006\b+\u0006\u0001\u0005\u0005\u0007\u0003\u0001',
          name: 'extKeyUsage',
          serverAuth: true
        },
        {
          id: '2.5.29.17',
          critical: false,
          value: '0#!bjosburn-desk1.amr.corp.intel.com',
          name: 'subjectAltName',
          altNames: [
            {
              type: 2,
              value: 'bjosburn-desk1.amr.corp.intel.com'
            }
          ]
        }
      ],
      publicKey: {
        n: {
          data: [
            22738545,
            197587975,
            40389632,
            128574718,
            240506609,
            63808004,
            67187052,
            35919572,
            169737366,
            33936565,
            185635620,
            147492990,
            212866555,
            84395707,
            185416446,
            9358767,
            202445054,
            236703450,
            48966368,
            138161318,
            118148456,
            243066976,
            170810889,
            59061508,
            38721111,
            5822199,
            138709036,
            102102931,
            116226639,
            265713316,
            7160787,
            134308469,
            226427970,
            198468271,
            28738538,
            118095746,
            201338751,
            81970455,
            67778028,
            46833239,
            20200318,
            190690637,
            193099148,
            1878279,
            252144637,
            253118855,
            76984714,
            82447264,
            240122701,
            213796277,
            94184548,
            127617332,
            70985315,
            30370735,
            266550620,
            85421547,
            159188368,
            202400332,
            218925813,
            129215156,
            232346940,
            117618248,
            268416298,
            7805939,
            227983989,
            56093111,
            236212882,
            230626031,
            120593771,
            85381909,
            93121282,
            260312881,
            86521760,
            12
          ],
          t: 74,
          s: 0
        },
        e: {
          data: [
            65537
          ],
          t: 1,
          s: 0
        }
      },
      md: {
        algorithm: 'sha256',
        blockLength: 64,
        digestLength: 32,
        messageLength: 544,
        fullMessageLength: [
          0,
          544
        ],
        messageLengthSize: 8,
        messageLength64: [
          0,
          544
        ]
      },
      signatureParameters: {
      },
      tbsCertificate: {
        tagClass: 0,
        type: 16,
        constructed: true,
        composed: true,
        value: [
          {
            tagClass: 128,
            type: 0,
            constructed: true,
            composed: true,
            value: [
              {
                tagClass: 0,
                type: 2,
                constructed: false,
                composed: false,
                value: '\u0002'
              }
            ]
          },
          {
            tagClass: 0,
            type: 2,
            constructed: false,
            composed: false,
            value: '02\u001bO©©@¯G¤þÈÃ{|Â'
          },
          {
            tagClass: 0,
            type: 16,
            constructed: true,
            composed: true,
            value: [
              {
                tagClass: 0,
                type: 6,
                constructed: false,
                composed: false,
                value: '*H÷\r\u0001\u0001\u000b'
              },
              {
                tagClass: 0,
                type: 5,
                constructed: false,
                composed: false,
                value: ''
              }
            ]
          },
          {
            tagClass: 0,
            type: 16,
            constructed: true,
            composed: true,
            value: [
              {
                tagClass: 0,
                type: 17,
                constructed: true,
                composed: true,
                value: [
                  {
                    tagClass: 0,
                    type: 16,
                    constructed: true,
                    composed: true,
                    value: [
                      {
                        tagClass: 0,
                        type: 6,
                        constructed: false,
                        composed: false,
                        value: 'U\u0004\u0003'
                      },
                      {
                        tagClass: 0,
                        type: 19,
                        constructed: false,
                        composed: false,
                        value: 'bjosburn-desk1.amr.corp.intel.com'
                      }
                    ]
                  }
                ]
              }
            ]
          },
          {
            tagClass: 0,
            type: 16,
            constructed: true,
            composed: true,
            value: [
              {
                tagClass: 0,
                type: 23,
                constructed: false,
                composed: false,
                value: '190813161732Z'
              },
              {
                tagClass: 0,
                type: 23,
                constructed: false,
                composed: false,
                value: '200813000000Z'
              }
            ]
          },
          {
            tagClass: 0,
            type: 16,
            constructed: true,
            composed: true,
            value: [
              {
                tagClass: 0,
                type: 17,
                constructed: true,
                composed: true,
                value: [
                  {
                    tagClass: 0,
                    type: 16,
                    constructed: true,
                    composed: true,
                    value: [
                      {
                        tagClass: 0,
                        type: 6,
                        constructed: false,
                        composed: false,
                        value: 'U\u0004\u0003'
                      },
                      {
                        tagClass: 0,
                        type: 19,
                        constructed: false,
                        composed: false,
                        value: 'bjosburn-desk1.amr.corp.intel.com'
                      }
                    ]
                  }
                ]
              }
            ]
          },
          {
            tagClass: 0,
            type: 16,
            constructed: true,
            composed: true,
            value: [
              {
                tagClass: 0,
                type: 16,
                constructed: true,
                composed: true,
                value: [
                  {
                    tagClass: 0,
                    type: 6,
                    constructed: false,
                    composed: false,
                    value: '*H÷\r\u0001\u0001\u0001'
                  },
                  {
                    tagClass: 0,
                    type: 5,
                    constructed: false,
                    composed: false,
                    value: ''
                  }
                ]
              },
              {
                tagClass: 0,
                type: 3,
                constructed: false,
                composed: true,
                value: [
                  {
                    tagClass: 0,
                    type: 16,
                    constructed: true,
                    composed: true,
                    value: [
                      {
                        tagClass: 0,
                        type: 2,
                        constructed: false,
                        composed: false,
                        value: "\u0000Å(7 ø@ó\u0015ë\u0002Qm1W0\u001dkÛñ.þ\u0014R5~}Âu\u0007q¿?ÿµ*p+dÙU<{:«M\fõÁ\u0006$É}\u0005QvÞ¿ã=\\\u001cöºô;&cy´E$dËä[^OûMN º\u0004±ñd\u0007ký\u0001Ê{uµÛTÑ4;~,©åt\n5ìN,Q|\u0000/pø!¶ê½F*ý\u0004B\u0016'PmCÓýgjFízOa_y8D,\u0005orNÖW8SPJ.^\tçÎ\u0007\nÍhÂÊbë*àá¼í¬\u0011\u0010þ\bìÚû\r:þP|k¼°\u0015û©\u0007ë\u0010$ ]KZ\u001dü\"AmD\u00011l<Ú NUÖñzOâhL\u0000¼o@qZöq"
                      },
                      {
                        tagClass: 0,
                        type: 2,
                        constructed: false,
                        composed: false,
                        value: '\u0001\u0000\u0001'
                      }
                    ]
                  }
                ],
                bitStringContents: "\u00000\u0001\n\u0002\u0001\u0001\u0000Å(7 ø@ó\u0015ë\u0002Qm1W0\u001dkÛñ.þ\u0014R5~}Âu\u0007q¿?ÿµ*p+dÙU<{:«M\fõÁ\u0006$É}\u0005QvÞ¿ã=\\\u001cöºô;&cy´E$dËä[^OûMN º\u0004±ñd\u0007ký\u0001Ê{uµÛTÑ4;~,©åt\n5ìN,Q|\u0000/pø!¶ê½F*ý\u0004B\u0016'PmCÓýgjFízOa_y8D,\u0005orNÖW8SPJ.^\tçÎ\u0007\nÍhÂÊbë*àá¼í¬\u0011\u0010þ\bìÚû\r:þP|k¼°\u0015û©\u0007ë\u0010$ ]KZ\u001dü\"AmD\u00011l<Ú NUÖñzOâhL\u0000¼o@qZöq\u0002\u0003\u0001\u0000\u0001",
                original: {
                  tagClass: 0,
                  type: 3,
                  constructed: false,
                  composed: true,
                  value: [
                    {
                      tagClass: 0,
                      type: 16,
                      constructed: true,
                      composed: true,
                      value: [
                        {
                          tagClass: 0,
                          type: 2,
                          constructed: false,
                          composed: false,
                          value: "\u0000Å(7 ø@ó\u0015ë\u0002Qm1W0\u001dkÛñ.þ\u0014R5~}Âu\u0007q¿?ÿµ*p+dÙU<{:«M\fõÁ\u0006$É}\u0005QvÞ¿ã=\\\u001cöºô;&cy´E$dËä[^OûMN º\u0004±ñd\u0007ký\u0001Ê{uµÛTÑ4;~,©åt\n5ìN,Q|\u0000/pø!¶ê½F*ý\u0004B\u0016'PmCÓýgjFízOa_y8D,\u0005orNÖW8SPJ.^\tçÎ\u0007\nÍhÂÊbë*àá¼í¬\u0011\u0010þ\bìÚû\r:þP|k¼°\u0015û©\u0007ë\u0010$ ]KZ\u001dü\"AmD\u00011l<Ú NUÖñzOâhL\u0000¼o@qZöq"
                        },
                        {
                          tagClass: 0,
                          type: 2,
                          constructed: false,
                          composed: false,
                          value: '\u0001\u0000\u0001'
                        }
                      ]
                    }
                  ]
                }
              }
            ]
          },
          {
            tagClass: 128,
            type: 3,
            constructed: true,
            composed: true,
            value: [
              {
                tagClass: 0,
                type: 16,
                constructed: true,
                composed: true,
                value: [
                  {
                    tagClass: 0,
                    type: 16,
                    constructed: true,
                    composed: true,
                    value: [
                      {
                        tagClass: 0,
                        type: 6,
                        constructed: false,
                        composed: false,
                        value: 'U\u001d\u000f'
                      },
                      {
                        tagClass: 0,
                        type: 4,
                        constructed: false,
                        composed: false,
                        value: '\u0003\u0002\u00040'
                      }
                    ]
                  },
                  {
                    tagClass: 0,
                    type: 16,
                    constructed: true,
                    composed: true,
                    value: [
                      {
                        tagClass: 0,
                        type: 6,
                        constructed: false,
                        composed: false,
                        value: 'U\u001d%'
                      },
                      {
                        tagClass: 0,
                        type: 4,
                        constructed: false,
                        composed: false,
                        value: '0\n\u0006\b+\u0006\u0001\u0005\u0005\u0007\u0003\u0001'
                      }
                    ]
                  },
                  {
                    tagClass: 0,
                    type: 16,
                    constructed: true,
                    composed: true,
                    value: [
                      {
                        tagClass: 0,
                        type: 6,
                        constructed: false,
                        composed: false,
                        value: 'U\u001d\u0011'
                      },
                      {
                        tagClass: 0,
                        type: 4,
                        constructed: false,
                        composed: false,
                        value: '0#!bjosburn-desk1.amr.corp.intel.com'
                      }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      }
    }
  ],
  keys: [
    {
      n: {
        data: [
          22738545,
          197587975,
          40389632,
          128574718,
          240506609,
          63808004,
          67187052,
          35919572,
          169737366,
          33936565,
          185635620,
          147492990,
          212866555,
          84395707,
          185416446,
          9358767,
          202445054,
          236703450,
          48966368,
          138161318,
          118148456,
          243066976,
          170810889,
          59061508,
          38721111,
          5822199,
          138709036,
          102102931,
          116226639,
          265713316,
          7160787,
          134308469,
          226427970,
          198468271,
          28738538,
          118095746,
          201338751,
          81970455,
          67778028,
          46833239,
          20200318,
          190690637,
          193099148,
          1878279,
          252144637,
          253118855,
          76984714,
          82447264,
          240122701,
          213796277,
          94184548,
          127617332,
          70985315,
          30370735,
          266550620,
          85421547,
          159188368,
          202400332,
          218925813,
          129215156,
          232346940,
          117618248,
          268416298,
          7805939,
          227983989,
          56093111,
          236212882,
          230626031,
          120593771,
          85381909,
          93121282,
          260312881,
          86521760,
          12
        ],
        t: 74,
        s: 0
      },
      e: {
        data: [
          65537
        ],
        t: 1,
        s: 0
      },
      d: {
        data: [
          103758629,
          3518031,
          207707674,
          207878625,
          32330180,
          19058444,
          58882766,
          18764541,
          82339376,
          107234765,
          58907316,
          21520218,
          87565935,
          255479564,
          45880227,
          21871026,
          243849737,
          221309371,
          122737625,
          97366032,
          174000406,
          197884566,
          55284564,
          38695658,
          126128031,
          89659275,
          114271106,
          189480146,
          36695461,
          117402121,
          82147113,
          143507915,
          150268292,
          111371930,
          119392047,
          43446728,
          261403084,
          201519105,
          159063941,
          91424094,
          121152201,
          214305901,
          205926896,
          58578439,
          90727152,
          21264988,
          101676567,
          183830128,
          182377713,
          137723307,
          217108263,
          93398571,
          18225046,
          264129626,
          263889928,
          218895248,
          155393904,
          214576048,
          148834406,
          197559651,
          60727650,
          196736217,
          258218157,
          253452337,
          264795944,
          199329817,
          49238628,
          233279161,
          61688992,
          35929616,
          206858143,
          153904243,
          82088744,
          1
        ],
        t: 74,
        s: 0
      },
      p: {
        data: [
          225867687,
          137277970,
          186754183,
          171438098,
          147791477,
          26424801,
          225059354,
          251418309,
          140132494,
          27224352,
          82379046,
          262830181,
          228283350,
          218001791,
          198425954,
          214212148,
          204411688,
          11812393,
          75977972,
          5515649,
          139294987,
          2692225,
          42136299,
          76316069,
          251175283,
          235434208,
          168986095,
          50749915,
          59509473,
          159196747,
          14541826,
          78681690,
          33902516,
          193739012,
          185325609,
          16148028,
          55215
        ],
        t: 37,
        s: 0
      },
      q: {
        data: [
          135455783,
          141675226,
          72455563,
          192316535,
          227561683,
          9244385,
          150417039,
          179047010,
          240770483,
          237278282,
          255200376,
          9892502,
          232737064,
          181138169,
          43213188,
          120141465,
          61710521,
          103624216,
          131780901,
          167688507,
          146554465,
          26036133,
          95920667,
          99035531,
          51519101,
          92092885,
          243235478,
          149972327,
          15553597,
          136391770,
          201772364,
          195172757,
          194220147,
          154704182,
          185908979,
          164514116,
          59906
        ],
        t: 37,
        s: 0
      },
      dP: {
        data: [
          212650249,
          5932719,
          31306711,
          194529123,
          4900112,
          25509180,
          183003473,
          30930318,
          108688262,
          54659678,
          208495870,
          52810471,
          192084720,
          230086152,
          193789884,
          79269328,
          261512227,
          125556783,
          155084623,
          194928727,
          227724568,
          186048469,
          152039066,
          39013099,
          233756238,
          185692559,
          238163732,
          40613942,
          235095284,
          206043579,
          96195515,
          152423105,
          9509195,
          198623274,
          181274275,
          199903832,
          29962
        ],
        t: 37,
        s: 0
      },
      dQ: {
        data: [
          214884847,
          204485932,
          254733344,
          207861161,
          84016115,
          205337866,
          191412097,
          222074260,
          144692651,
          224957339,
          75021662,
          227162117,
          74526327,
          15205209,
          162066070,
          33185162,
          241728682,
          159293736,
          167596481,
          3555115,
          255519441,
          65731280,
          112538338,
          60344183,
          244993422,
          20885648,
          151474791,
          257844641,
          173919319,
          221531859,
          122761889,
          140903176,
          111851252,
          243518094,
          138588488,
          240631220,
          479
        ],
        t: 37,
        s: 0
      },
      qInv: {
        data: [
          114626170,
          225689970,
          63516024,
          148276517,
          218683474,
          192447296,
          130572219,
          223145921,
          237087526,
          197014424,
          232895021,
          193031985,
          62528318,
          12597036,
          85708359,
          95804681,
          59208000,
          19105345,
          112919565,
          130642026,
          184287084,
          208966846,
          99200337,
          138341036,
          160695188,
          51985957,
          62749164,
          210620303,
          161605007,
          84932520,
          219882383,
          201348087,
          196213838,
          39969513,
          264003514,
          68957628,
          14218
        ],
        t: 37,
        s: 0
      }
    }
  ]
}

const EXPECTED_CERT =
    {
      provisioningCertificateObj: {
        certChain: [
          '\r\nMIIDNDCCAhygAwIBAgIQMDIbT6mpQK9HpP7Iw3t8wjANBgkqhkiG9w0BAQsFADAs\r\nMSowKAYDVQQDEyFiam9zYnVybi1kZXNrMS5hbXIuY29ycC5pbnRlbC5jb20wHhcN\r\nMTkwODEzMTYxNzMyWhcNMjAwODEzMDAwMDAwWjAsMSowKAYDVQQDEyFiam9zYnVy\r\nbi1kZXNrMS5hbXIuY29ycC5pbnRlbC5jb20wggEiMA0GCSqGSIb3DQEBAQUAA4IB\r\nDwAwggEKAoIBAQDFKDeg+EDzFYzrAlFtMVcwHWvb8S7+FFKSNX6bfZbCdQdxvz//\r\ntSpwK2SN2VU8ezqrTQyK9cEGJMl9BZBRdt6/4z1cHPa69DsmY3m0k0WdJGTL5Fte\r\nT/tNTqC6BJaxivFkmH8Ha/0BypB7gnWMtdtU0TQ7fiyp5XQKNexOLFF8AC9/cJ/4\r\nIbaD6r1GKv1/BEKAFidQbUPT/WdqRu16T2FfeThEiCwFjW9yTtZXOFNQSi5eCefO\r\nhgcKzWiDwspi6yrg4bztrBEQ/gjs2vsNOv5QfGu8sBX7jKkH6xCTJCBdS1od/JYi\r\nQW1EATFsPNogTlXW8XqeT+JoTAC8b0BxWvZxAgMBAAGjUjBQMAsGA1UdDwQEAwIE\r\nMDATBgNVHSUEDDAKBggrBgEFBQcDATAsBgNVHREEJTAjgiFiam9zYnVybi1kZXNr\r\nMS5hbXIuY29ycC5pbnRlbC5jb20wDQYJKoZIhvcNAQELBQADggEBAIxb2nWSaWG6\r\nz9Fio56DX1WysE8E8eXDW2hEHKeVQ29lKfplAOhZBI2C5eulGweUDH90NLK2b480\r\naED+/GlTK2OFzL5q2XiBb3ISpS+iRvDkVkUMFjMibGFmag8PqHn+E6ZU47oEEdqp\r\nzlp/RAPr3i3j7PfqK2b8+L2A7lDzmF/UPdmFPdyCDvUN7IIkD31IEDuCR0fy2g6a\r\nHEtt3gep7XMKbSMsIi9oMZNuwCvU0Zag39FYXgoNuq8RKNUCtHPavlPCL7t/Coyx\r\nsg6PdNrGANcDpQ8Uqbf9hqS08/JbHRaAbtLIuVAlBko9b00cE3cz135hPE57DcvK\r\ndf0cKAgsx4g=\r\n\r\n',
          undefined
        ],
        privateKey: {
          n: {
            data: [
              22738545,
              197587975,
              40389632,
              128574718,
              240506609,
              63808004,
              67187052,
              35919572,
              169737366,
              33936565,
              185635620,
              147492990,
              212866555,
              84395707,
              185416446,
              9358767,
              202445054,
              236703450,
              48966368,
              138161318,
              118148456,
              243066976,
              170810889,
              59061508,
              38721111,
              5822199,
              138709036,
              102102931,
              116226639,
              265713316,
              7160787,
              134308469,
              226427970,
              198468271,
              28738538,
              118095746,
              201338751,
              81970455,
              67778028,
              46833239,
              20200318,
              190690637,
              193099148,
              1878279,
              252144637,
              253118855,
              76984714,
              82447264,
              240122701,
              213796277,
              94184548,
              127617332,
              70985315,
              30370735,
              266550620,
              85421547,
              159188368,
              202400332,
              218925813,
              129215156,
              232346940,
              117618248,
              268416298,
              7805939,
              227983989,
              56093111,
              236212882,
              230626031,
              120593771,
              85381909,
              93121282,
              260312881,
              86521760,
              12
            ],
            t: 74,
            s: 0
          },
          e: {
            data: [
              65537
            ],
            t: 1,
            s: 0
          },
          d: {
            data: [
              103758629,
              3518031,
              207707674,
              207878625,
              32330180,
              19058444,
              58882766,
              18764541,
              82339376,
              107234765,
              58907316,
              21520218,
              87565935,
              255479564,
              45880227,
              21871026,
              243849737,
              221309371,
              122737625,
              97366032,
              174000406,
              197884566,
              55284564,
              38695658,
              126128031,
              89659275,
              114271106,
              189480146,
              36695461,
              117402121,
              82147113,
              143507915,
              150268292,
              111371930,
              119392047,
              43446728,
              261403084,
              201519105,
              159063941,
              91424094,
              121152201,
              214305901,
              205926896,
              58578439,
              90727152,
              21264988,
              101676567,
              183830128,
              182377713,
              137723307,
              217108263,
              93398571,
              18225046,
              264129626,
              263889928,
              218895248,
              155393904,
              214576048,
              148834406,
              197559651,
              60727650,
              196736217,
              258218157,
              253452337,
              264795944,
              199329817,
              49238628,
              233279161,
              61688992,
              35929616,
              206858143,
              153904243,
              82088744,
              1
            ],
            t: 74,
            s: 0
          },
          p: {
            data: [
              225867687,
              137277970,
              186754183,
              171438098,
              147791477,
              26424801,
              225059354,
              251418309,
              140132494,
              27224352,
              82379046,
              262830181,
              228283350,
              218001791,
              198425954,
              214212148,
              204411688,
              11812393,
              75977972,
              5515649,
              139294987,
              2692225,
              42136299,
              76316069,
              251175283,
              235434208,
              168986095,
              50749915,
              59509473,
              159196747,
              14541826,
              78681690,
              33902516,
              193739012,
              185325609,
              16148028,
              55215
            ],
            t: 37,
            s: 0
          },
          q: {
            data: [
              135455783,
              141675226,
              72455563,
              192316535,
              227561683,
              9244385,
              150417039,
              179047010,
              240770483,
              237278282,
              255200376,
              9892502,
              232737064,
              181138169,
              43213188,
              120141465,
              61710521,
              103624216,
              131780901,
              167688507,
              146554465,
              26036133,
              95920667,
              99035531,
              51519101,
              92092885,
              243235478,
              149972327,
              15553597,
              136391770,
              201772364,
              195172757,
              194220147,
              154704182,
              185908979,
              164514116,
              59906
            ],
            t: 37,
            s: 0
          },
          dP: {
            data: [
              212650249,
              5932719,
              31306711,
              194529123,
              4900112,
              25509180,
              183003473,
              30930318,
              108688262,
              54659678,
              208495870,
              52810471,
              192084720,
              230086152,
              193789884,
              79269328,
              261512227,
              125556783,
              155084623,
              194928727,
              227724568,
              186048469,
              152039066,
              39013099,
              233756238,
              185692559,
              238163732,
              40613942,
              235095284,
              206043579,
              96195515,
              152423105,
              9509195,
              198623274,
              181274275,
              199903832,
              29962
            ],
            t: 37,
            s: 0
          },
          dQ: {
            data: [
              214884847,
              204485932,
              254733344,
              207861161,
              84016115,
              205337866,
              191412097,
              222074260,
              144692651,
              224957339,
              75021662,
              227162117,
              74526327,
              15205209,
              162066070,
              33185162,
              241728682,
              159293736,
              167596481,
              3555115,
              255519441,
              65731280,
              112538338,
              60344183,
              244993422,
              20885648,
              151474791,
              257844641,
              173919319,
              221531859,
              122761889,
              140903176,
              111851252,
              243518094,
              138588488,
              240631220,
              479
            ],
            t: 37,
            s: 0
          },
          qInv: {
            data: [
              114626170,
              225689970,
              63516024,
              148276517,
              218683474,
              192447296,
              130572219,
              223145921,
              237087526,
              197014424,
              232895021,
              193031985,
              62528318,
              12597036,
              85708359,
              95804681,
              59208000,
              19105345,
              112919565,
              130642026,
              184287084,
              208966846,
              99200337,
              138341036,
              160695188,
              51985957,
              62749164,
              210620303,
              161605007,
              84932520,
              219882383,
              201348087,
              196213838,
              39969513,
              264003514,
              68957628,
              14218
            ],
            t: 37,
            s: 0
          }
        }
      },
      fingerprint: undefined
    }

export { TEST_PFXCERT, EXPECTED_CERT }
