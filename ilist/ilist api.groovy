ilist Websites API documentation, allows developers of Real Estate Websites, to synchronize properties of a Real Estate Agency that use ilist CRM, with the website of the Agency.

All API Calls should be made to the following API-URL: https://ilist.e-agents.gr

Each API Call should contain the AuthenticationToken in the header as Simple Authentication.

For example:

key : authorization

value: d33db979-e6cf-4661-9e65-94fff50ecca6

“value” is a unique key that the Agency can create from their ilist account and provide it to you (The key indicated in this documentation is for testing only).

All API Calls will return the same json response with a structure as indicated below, where “data” is the relevant data model, depending on the call you have made.

javascript
{
  "code": null,
  "success": true,
  "total": 0,
  "data": [object],
  "nextPage": null,
  "error": null
}
API Limitations

In order to protect the system from receiving more data than it can handle and to ensure an equitable distribution of the system resources, there are limitations on the number of calls that each Real Estate Website can make.

The limit is 10 API Calls (GET, POST, etc) per minute.

In case this limit is exceeded, the appropriate error will be returned.

AUTHORIZATION
API Key
Key
authorization

Value
<value>

GET
Properties
{{API-URL}}/api/properties
GET Call that returns true if the authorization token is correct

AUTHORIZATION
API Key
This request is using API Key from collectionilist Websites API Documentation


curl --location -g '{{API-URL}}/api/properties'

{
  "code": null,
  "success": true,
  "total": 0,
  "data": true,
  "nextPage": null,
  "error": null
}



curl --location -g '{{API-URL}}/api/properties/927748' \
--header 'Details: Full'

{
  "code": "",
  "success": true,
  "total": 1,
  "data": {
    "Id": 927748,
    "Category_ID": 1,
    "SubCategory_ID": 3,
    "Aim_ID": 1,
    "Price": 200000,
    "SqrMeters": 170,
    "PricePerSqrm": 1176.47,
    "Rooms": 3,
    "Area_ID": 2011,
    "PostalCode": "176 75",
    "EnergyClass_ID": 3,
    "Images": [
      {
        "Id": 3813,
        "OrderNum": 3,
        "Url": "https://37.6.255.2:9081/appFol/appDetails/estatePhotos/fol927748/img_25216f25-e589-480d-8d5c-6b65a67701ee.jpeg",
        "ThumbUrl": "https://37.6.255.2:9081/appFol/appDetails/estatePhotos/fol927748/Thumb_25216f25-e589-480d-8d5c-6b65a67701ee.jpeg"
      },
      {
        "Id": 3814,
        "OrderNum": 4,
        "Url": "https://37.6.255.2:9081/appFol/appDetails/estatePhotos/fol927748/img_c693ecd2-5b61-44fb-9587-8e793e47de91.jpeg",
        "ThumbUrl": "https://37.6.255.2:9081/appFol/appDetails/estatePhotos/fol927748/Thumb_c693ecd2-5b61-44fb-9587-8e793e47de91.jpeg"
      },
      {
        "Id": 3815,
        "OrderNum": 2,
        "Url": "https://37.6.255.2:9081/appFol/appDetails/estatePhotos/fol927748/img_2944a219-3c0e-48ed-808d-e74bd0d097f4.jpeg",
        "ThumbUrl": "https://37.6.255.2:9081/appFol/appDetails/estatePhotos/fol927748/Thumb_2944a219-3c0e-48ed-808d-e74bd0d097f4.jpeg"
      },
      {
        "Id": 3816,
        "OrderNum": 1,
        "Url": "https://37.6.255.2:9081/appFol/appDetails/estatePhotos/fol927748/img_a85888bc-be27-4045-8109-51fccdb6b97b.jpeg",
        "ThumbUrl": "https://37.6.255.2:9081/appFol/appDetails/estatePhotos/fol927748/Thumb_a85888bc-be27-4045-8109-51fccdb6b97b.jpeg"
      },
      {
        "Id": 3817,
        "OrderNum": 5,
        "Url": "https://37.6.255.2:9081/appFol/appDetails/estatePhotos/fol927748/img_72da73e7-242a-4a4a-ae7f-1add6cfdc621.jpeg",
        "ThumbUrl": "https://37.6.255.2:9081/appFol/appDetails/estatePhotos/fol927748/Thumb_72da73e7-242a-4a4a-ae7f-1add6cfdc621.jpeg"
      },
      {
        "Id": 3818,
        "OrderNum": 6,
        "Url": "https://37.6.255.2:9081/appFol/appDetails/estatePhotos/fol927748/img_450eaa95-4773-4177-b030-b26f556d4feb.jpeg",
        "ThumbUrl": "https://37.6.255.2:9081/appFol/appDetails/estatePhotos/fol927748/Thumb_450eaa95-4773-4177-b030-b26f556d4feb.jpeg"
      }
    ],
    "Characteristics": [
      {
        "Id": 282,
        "Language_Id": 4,
        "Title": "Αποθήκη",
        "Value": "true",
        "LookupType": ""
      },
      {
        "Id": 288,
        "Language_Id": 34,
        "Title": "Κουφώματα",
        "Value": "1",
        "LookupType": "FramesTypes"
      },
      {
        "Id": 289,
        "Language_Id": 34,
        "Title": "Τζάμια",
        "Value": "2",
        "LookupType": "GlazedWindows"
      },
      {
        "Id": 297,
        "Language_Id": 3,
        "Title": "Τίτλος",
        "Value": "927748 - Maisonette for For sale, Goudi, 170 sq.m., €200.000",
        "LookupType": ""
      },
      {
        "Id": 297,
        "Language_Id": 4,
        "Title": "Τίτλος",
        "Value": "927748 - Μεζονέτα Προς Πώληση, Γουδή, 170 τ.μ., €200.000",
        "LookupType": ""
      },
      {
        "Id": 298,
        "Language_Id": 3,
        "Title": "Αγγελία",
        "Value": "domis: Storagekatalilo: Business, Investmentparkings: 0 - ",
        "LookupType": ""
      },
      {
        "Id": 298,
        "Language_Id": 4,
        "Title": "Αγγελία",
        "Value": "domis: Αποθήκηkatalilo: Επαγγελματικό, Επένδυσηparkings: 0 - ",
        "LookupType": ""
      },
      {
        "Id": 299,
        "Language_Id": 4,
        "Title": "Επιπλέον κείμενο (ΧΕ)",
        "Value": "Μεζονέτα Προς Πώληση στην περιοχή: Γουδή. Το εμβαδόν του ακινήτου είναι 170 τ.μ.. Αποτελείται από: 3 Υ/Δ, έχει κουφώματα Αλουμινίου με Διπλά τζάμια, Β+ ενεργειακό πιστοποιητικό. Η κατάστασή του είναι: Καλή, έχει θέα Πάρκο, Βουνό και έχει Ανατολικομεσημβρινό προσανατολισμό. Το ακίνητο είναι Βαμμένο, Γωνιακό, Αποθήκη, Χρηματοκιβώτιο, Τριφασικό Ρεύμα, Γκαζόν. Τιμή: 200.000. Kazakos Properties, Τηλέφωνο Επικοινωνίας: 6972093167, 2109345586, email: kimonas@fortunethellas.gr, website: https://www.e-agents.gr",
        "LookupType": ""
      },
      {
        "Id": 302,
        "Language_Id": 34,
        "Title": "Κατάσταση",
        "Value": "5",
        "LookupType": "EstateStatus"
      },
      {
        "Id": 303,
        "Language_Id": 34,
        "Title": "Με Θέα",
        "Value": "2,5",
        "LookupType": "View"
      },
      {
        "Id": 304,
        "Language_Id": 34,
        "Title": "Προσανατολισμός",
        "Value": "2",
        "LookupType": "Orientation"
      },
      {
        "Id": 306,
        "Language_Id": 34,
        "Title": "Κατάλληλο για",
        "Value": "3,5",
        "LookupType": "SuitableFor"
      },
      {
        "Id": 307,
        "Language_Id": 34,
        "Title": "Ιδιαίτερα Χαρακτηριστικά",
        "Value": "3,5",
        "LookupType": "PropertySpecialFeatures"
      },
      {
        "Id": 311,
        "Language_Id": 34,
        "Title": "Πλεονεκτήματα",
        "Value": "9,11,13",
        "LookupType": "PropertyAdvantages"
      }
    ],
    "AdditionalLanguages": [
      {
        "MLLanguage_ID": 23,
        "Language": "Egyptian Arabic",
        "Title": "title",
        "PropertyAd": "aggelia",
        "Description": "description"
      },
      {
        "MLLanguage_ID": 5,
        "Language": "Bengali",
        "Title": "title 2",
        "PropertyAd": "aggelia 2",
        "Description": "description 2"
      }
    ],
    "TotalParkings": 0,
    "Parkings": [],
    "DistanceFrom": [
      {
        "Place_ID": 1,
        "Distance": 12,
        "Measure_ID": 1,
        "Description": [
          {
            "Language_ID": 3,
            "Value": ""
          },
          {
            "Language_ID": 4,
            "Value": ""
          }
        ]
      },
      {
        "Place_ID": 14,
        "Distance": 400,
        "Measure_ID": 2,
        "Description": [
          {
            "Language_ID": 3,
            "Value": ""
          },
          {
            "Language_ID": 4,
            "Value": "aasda dfgdfgdf"
          }
        ]
      }
    ],
    "Basements": [],
    "Partner": {
      "Id": 109100,
      "Firstname": "Μαρία",
      "Lastname": "Μαυρίδη",
      "Email": "maria@gmail.com",
      "Phone": "6890236872",
      "PhotoUrl": "https://37.6.255.2:9081"
    },
    "Flags": [],
    "SendDate": "2022-05-25T15:56:56.853",
    "UpdateDate": "2022-05-26T16:31:09.353",
    "Token": "d33db979-e6cf-4661-9e65-94fff50ecca6",
    "isSync": true,
    "StatusID": 1
  },
  "nextPage": null,
  "error": null
}


curl --location -g '{{API-URL}}/api/properties' \
--header 'Details: Basic' \
--data '{
    "StatusID": "1", // 1-active, 2-deleted
    "isSync": true, //required
    "SendDateFromUTC": "2020-02-09T17:06:02.783",
    "SendDateToUTC": "2026-02-27T17:06:02.783",
    "UpdateDateFromUTC": "2020-02-10T17:06:02.783",
    "UpdateDateToUTC": "2026-02-27T17:06:02.783",
    "IncludeDeletedFromCrm": true
}'


{
  "code": "",
  "success": true,
  "total": 50,
  "data": [
    {
      "Id": 927748,
      "Category_ID": 1,
      "SubCategory_ID": 3,
      "Aim_ID": 1,
      "Price": 200000,
      "SqrMeters": 170,
      "PricePerSqrm": 1176.47,
      "Rooms": 3,
      "Area_ID": 2011,
      "PostalCode": "176 75",
      "EnergyClass_ID": 3,
      "Images": [
        {
          "Id": 3813,
          "OrderNum": 3,
          "Url": "https://37.6.255.2:9081/appFol/appDetails/estatePhotos/fol927748/img_25216f25-e589-480d-8d5c-6b65a67701ee.jpeg",
          "ThumbUrl": "https://37.6.255.2:9081/appFol/appDetails/estatePhotos/fol927748/Thumb_25216f25-e589-480d-8d5c-6b65a67701ee.jpeg"
        },
        {
          "Id": 3814,
          "OrderNum": 4,
          "Url": "https://37.6.255.2:9081/appFol/appDetails/estatePhotos/fol927748/img_c693ecd2-5b61-44fb-9587-8e793e47de91.jpeg",
          "ThumbUrl": "https://37.6.255.2:9081/appFol/appDetails/estatePhotos/fol927748/Thumb_c693ecd2-5b61-44fb-9587-8e793e47de91.jpeg"
        },
        {
          "Id": 3815,
          "OrderNum": 2,
          "Url": "https://37.6.255.2:9081/appFol/appDetails/estatePhotos/fol927748/img_2944a219-3c0e-48ed-808d-e74bd0d097f4.jpeg",
          "ThumbUrl": "https://37.6.255.2:9081/appFol/appDetails/estatePhotos/fol927748/Thumb_2944a219-3c0e-48ed-808d-e74bd0d097f4.jpeg"
        },
        {
          "Id": 3816,
          "OrderNum": 1,
          "Url": "https://37.6.255.2:9081/appFol/appDetails/estatePhotos/fol927748/img_a85888bc-be27-4045-8109-51fccdb6b97b.jpeg",
          "ThumbUrl": "https://37.6.255.2:9081/appFol/appDetails/estatePhotos/fol927748/Thumb_a85888bc-be27-4045-8109-51fccdb6b97b.jpeg"
        },
        {
          "Id": 3817,
          "OrderNum": 5,
          "Url": "https://37.6.255.2:9081/appFol/appDetails/estatePhotos/fol927748/img_72da73e7-242a-4a4a-ae7f-1add6cfdc621.jpeg",
          "ThumbUrl": "https://37.6.255.2:9081/appFol/appDetails/estatePhotos/fol927748/Thumb_72da73e7-242a-4a4a-ae7f-1add6cfdc621.jpeg"
        },
        {
          "Id": 3818,
          "OrderNum": 6,
          "Url": "https://37.6.255.2:9081/appFol/appDetails/estatePhotos/fol927748/img_450eaa95-4773-4177-b030-b26f556d4feb.jpeg",
          "ThumbUrl": "https://37.6.255.2:9081/appFol/appDetails/estatePhotos/fol927748/Thumb_450eaa95-4773-4177-b030-b26f556d4feb.jpeg"
        }
      ],
      "Characteristics": [
        {
          "Id": 297,
          "Language_Id": 3,
          "Title": "Τίτλος",
          "Value": "927748 - Maisonette for For sale, Goudi, 170 sq.m., €200.000",
          "LookupType": ""
        },
        {
          "Id": 297,
          "Language_Id": 4,
          "Title": "Τίτλος",
          "Value": "927748 - Μεζονέτα Προς Πώληση, Γουδή, 170 τ.μ., €200.000",
          "LookupType": ""
        },
        {
          "Id": 298,
          "Language_Id": 3,
          "Title": "Αγγελία",
          "Value": "domis: Storagekatalilo: Business, Investmentparkings: 0 - ",
          "LookupType": ""
        },
        {
          "Id": 298,
          "Language_Id": 4,
          "Title": "Αγγελία",
          "Value": "domis: Αποθήκηkatalilo: Επαγγελματικό, Επένδυσηparkings: 0 - ",
          "LookupType": ""
        },
        {
          "Id": 299,
          "Language_Id": 4,
          "Title": "Επιπλέον κείμενο (ΧΕ)",
          "Value": "Μεζονέτα Προς Πώληση στην περιοχή: Γουδή. Το εμβαδόν του ακινήτου είναι 170 τ.μ.. Αποτελείται από: 3 Υ/Δ, έχει κουφώματα Αλουμινίου με Διπλά τζάμια, Β+ ενεργειακό πιστοποιητικό. Η κατάστασή του είναι: Καλή, έχει θέα Πάρκο, Βουνό και έχει Ανατολικομεσημβρινό προσανατολισμό. Το ακίνητο είναι Βαμμένο, Γωνιακό, Αποθήκη, Χρηματοκιβώτιο, Τριφασικό Ρεύμα, Γκαζόν. Τιμή: 200.000. Kazakos Properties, Τηλέφωνο Επικοινωνίας: 6972093167, 2109345586, email: kimonas@fortunethellas.gr, website: https://www.e-agents.gr",
          "LookupType": ""
        }
      ],
      "AdditionalLanguages": [],
      "TotalParkings": 0,
      "Partner": {
        "Id": 109100,
        "Firstname": "Μαρία",
        "Lastname": "Μαυρίδη",
        "Email": "maria@gmail.com",
        "Phone": "6890236872",
        "PhotoUrl": "https://37.6.255.2:9081"
      },
      "Flags": [],
      "SendDate": "2022-05-25T15:56:56.853",
      "UpdateDate": "2022-05-26T16:31:09.353",
      "Token": "d33db979-e6cf-4661-9e65-94fff50ecca6",
      "isSync": true,
      "StatusID": 1
    },
    {
      "Id": 927770,
      "Category_ID": 1,
      "SubCategory_ID": 4,
      "Aim_ID": 1,
      "CustomCode": "sdfgs",
      "Price": 590000,
      "SqrMeters": 290,
      "PricePerSqrm": 2034.48,
      "BuildingYear": 1990,
      "PlotSqrMeters": 580,
      "Rooms": 4,
      "MasterBedrooms": 1,
      "Bathrooms": 3,
      "WC": 2,
      "Area_ID": 2208,
      "SubArea_ID": 106293,
      "Latitude": 37.870064367231336,
      "Longitude": 23.76494135379792,
      "PostalCode": "166 74",
      "EnergyClass_ID": 2,
      "Images": [
        {
          "Id": 1168,
          "OrderNum": 1,
          "Url": "https://37.6.255.2:9081/appFol/appDetails/estatePhotos/fol927770/img_2.jpeg",
          "ThumbUrl": "https://37.6.255.2:9081/appFol/appDetails/estatePhotos/fol927770/Thumb_2.jpeg"
        },
        {
          "Id": 1169,
          "OrderNum": 2,
          "Url": "https://37.6.255.2:9081/appFol/appDetails/estatePhotos/fol927770/img_3.jpeg",
          "ThumbUrl": "https://37.6.255.2:9081/appFol/appDetails/estatePhotos/fol927770/Thumb_3.jpeg"
        }
      ],
      "Characteristics": [
        {
          "Id": 297,
          "Language_Id": 3,
          "Title": "Τίτλος",
          "Value": "927770 - Μονοκατοικία for Πώληση, Γλυφάδα, 290 sq.m., €590.000",
          "LookupType": ""
        },
        {
          "Id": 297,
          "Language_Id": 4,
          "Title": "Τίτλος",
          "Value": "927770 - Μονοκατοικία Προς Πώληση, Γλυφάδα, 290 τ.μ., €590.000",
          "LookupType": ""
        },
        {
          "Id": 298,
          "Language_Id": 4,
          "Title": "Αγγελία",
          "Value": "Προς Πώληση, Μονοκατοικία στην περιοχή: Γλυφάδα - Γκολφ. Το εμβαδόν του είναι 290 τ.μ. και βρίσκεται σε οικόπεδο 580 τ.μ.. Αποτελείται από: 4 Υ/Δ (1 Master), έχει 3 μπάνια, 2 wc, 2 κουζίνα/ες, Κουφώματα Αλουμινίου με Διπλά τζάμια, 2 θέσεις στάθμευσης. Διαθέτει θέρμανση Αυτόνομη Φυσικό αέριο, είναι ενεργειακής κλάσης Α, η κατάστασή του είναι: Φρεσκοβαμμένο, Πολύ καλή κατάσταση, έχει θέα σε Πλατεία, Θάλασσα και ο προσανατολισμός του είναι Ανατολικομεσημβρινό.Τα ιδιαίτερα χαρακτηριστικά του ακινήτου είναι: Βαμμένο, Επιπλωμένο, Γωνιακό. Είναι κατάλληλο για: Εξοχική κατοικία, Βραχυχρόνια Μίσθωση, Επένδυση, Εισόδημα . Τα πλεονεκτήματα του ακινήτου είναι: Εσωτερικό Ασανσέρ, Playroom, BBQ, Χρηματοκιβώτιο, Νυχτερινό Ρεύμα, Τριφασικό Ρεύμα, Αυτόματο Πότισμα. Τιμή: 590.000. Kazakos Properties, Τηλέφωνο Επικοινωνίας: 697 209 3167, email: kimonas@fortunethellas.gr, website: https://www.e-agents.gr",
          "LookupType": ""
        },
        {
          "Id": 299,
          "Language_Id": 4,
          "Title": "Επιπλέον κείμενο (ΧΕ)",
          "Value": "Προς Πώληση, Μονοκατοικία στην περιοχή: Γλυφάδα - Γκολφ. Το εμβαδόν του είναι 290 τ.μ. και βρίσκεται σε οικόπεδο 580 τ.μ.. Αποτελείται από: 4 Υ/Δ (1 Master), έχει 3 μπάνια, 2 wc, 2 κουζίνα/ες, Κουφώματα Αλουμινίου με Διπλά τζάμια, 2 θέσεις στάθμευσης. Διαθέτει θέρμανση Αυτόνομη Φυσικό αέριο, είναι ενεργειακής κλάσης Α, η κατάστασή του είναι: Φρεσκοβαμμένο, Πολύ καλή κατάσταση, έχει θέα σε Πλατεία, Θάλασσα και ο προσανατολισμός του είναι Ανατολικομεσημβρινό.Τα ιδιαίτερα χαρακτηριστικά του ακινήτου είναι: Βαμμένο, Επιπλωμένο, Γωνιακό. Είναι κατάλληλο για: Εξοχική κατοικία, Βραχυχρόνια Μίσθωση, Επένδυση, Εισόδημα . Τα πλεονεκτήματα του ακινήτου είναι: Εσωτερικό Ασανσέρ, Playroom, BBQ, Χρηματοκιβώτιο, Νυχτερινό Ρεύμα, Τριφασικό Ρεύμα, Αυτόματο Πότισμα. Τιμή: 590.000. Kazakos Properties, Τηλέφωνο Επικοινωνίας: 697 209 3167, email: kimonas@fortunethellas.gr, website: https://www.e-agents.gr",
          "LookupType": ""
        }
      ],
      "AdditionalLanguages": [
        {
          "MLLanguage_ID": 23,
          "Language": "Egyptian Arabic",
          "Title": "title",
          "PropertyAd": "aggelia",
          "Description": "description"
        },
        {
          "MLLanguage_ID": 5,
          "Language": "Bengali",
          "Title": "title 2",
          "PropertyAd": "aggelia 2",
          "Description": "description 2"
        }
      ],
      "TotalParkings": 2,
      "Partner": {
        "Id": 108098,
        "Firstname": "Θανάσης",
        "Lastname": "Αθανασόπουλος",
        "Email": "kimonas@fortunethellas.gr",
        "Phone": "697 209 3168",
        "PhotoUrl": "https://37.6.255.2:9081"
      },
      "Flags": [],
      "SendDate": "2022-02-14T17:06:02.367",
      "UpdateDate": "2022-05-26T16:36:13.637",
      "Token": "d33db979-e6cf-4661-9e65-94fff50ecca6",
      "isSync": true,
      "StatusID": 1
    },
    {
      "Id": 928782,
      "Category_ID": 1,
      "SubCategory_ID": 4,
      "Aim_ID": 1,
      "CustomCode": "sdfgs",
      "Price": 500023,
      "SqrMeters": 320,
      "PricePerSqrm": 1562.57,
      "BuildingYear": 1990,
      "PlotSqrMeters": 9000,
      "Rooms": 4,
      "MasterBedrooms": 1,
      "Bathrooms": 3,
      "WC": 2,
      "Floor_ID": 30,
      "Levels": "30,50,60",
      "Area_ID": 2208,
      "Latitude": 37.870284571199164,
      "Longitude": 23.76471604824067,
      "PostalCode": "166 74",
      "EnergyClass_ID": 5,
      "Images": [
        {
          "Id": 3151,
          "OrderNum": 2,
          "Url": "https://37.6.255.2:9081/appFol/appDetails/estatePhotos/fol928782/img_1.jpeg",
          "ThumbUrl": "https://37.6.255.2:9081/appFol/appDetails/estatePhotos/fol928782/Thumb_1.jpeg"
        },
        {
          "Id": 3152,
          "OrderNum": 3,
          "Url": "https://37.6.255.2:9081/appFol/appDetails/estatePhotos/fol928782/img_2.jpeg",
          "ThumbUrl": "https://37.6.255.2:9081/appFol/appDetails/estatePhotos/fol928782/Thumb_2.jpeg"
        },
        {
          "Id": 3153,
          "OrderNum": 4,
          "Url": "https://37.6.255.2:9081/appFol/appDetails/estatePhotos/fol928782/img_3.jpeg",
          "ThumbUrl": "https://37.6.255.2:9081/appFol/appDetails/estatePhotos/fol928782/Thumb_3.jpeg"
        },
        {
          "Id": 3154,
          "OrderNum": 5,
          "Url": "https://37.6.255.2:9081/appFol/appDetails/estatePhotos/fol928782/img_4.jpeg",
          "ThumbUrl": "https://37.6.255.2:9081/appFol/appDetails/estatePhotos/fol928782/Thumb_4.jpeg"
        },
        {
          "Id": 3155,
          "OrderNum": 6,
          "Url": "https://37.6.255.2:9081/appFol/appDetails/estatePhotos/fol928782/img_5.jpeg",
          "ThumbUrl": "https://37.6.255.2:9081/appFol/appDetails/estatePhotos/fol928782/Thumb_5.jpeg"
        },
        {
          "Id": 3156,
          "OrderNum": 7,
          "Url": "https://37.6.255.2:9081/appFol/appDetails/estatePhotos/fol928782/img_6.jpeg",
          "ThumbUrl": "https://37.6.255.2:9081/appFol/appDetails/estatePhotos/fol928782/Thumb_6.jpeg"
        },
        {
          "Id": 3157,
          "OrderNum": 8,
          "Url": "https://37.6.255.2:9081/appFol/appDetails/estatePhotos/fol928782/img_7.jpeg",
          "ThumbUrl": "https://37.6.255.2:9081/appFol/appDetails/estatePhotos/fol928782/Thumb_7.jpeg"
        },


        curl --location -g '{{API-URL}}/api/lookups/places' \
--header 'Language: 4'


curl --location -g '{{API-URL}}/api/lookups/PropertyAmenities' \
--header 'Language: 4'


curl --location -g '{{API-URL}}/api/lookups/PropertySecurity' \
--header 'Language: 4'


curl --location -g '{{API-URL}}/api/lookups/HeatingType' \
--header 'Language: 4'


curl --location -g '{{API-URL}}/api/lookups/PropertySpecialFeatures' \
--header 'Language: 4'


curl --location -g '{{API-URL}}/api/lookups/PropertyUniqueFeatures' \
--header 'Language: 4'


curl --location -g '{{API-URL}}/api/lookups/NearTo' \
--header 'Language: 4'


curl --location -g '{{API-URL}}/api/lookups/ImageTypes' \
--header 'Language: 4'


curl --location -g '{{API-URL}}/api/lookups/Geography' \
--header 'Language: 4'


curl --location -g '{{API-URL}}/api/lookups/propertycategories' \
--header 'Language: 4'


curl --location -g '{{API-URL}}/api/lookups/propertysubcategories' \
--header 'Language: 4'


curl --location -g '{{API-URL}}/api/lookups/floors' \
--header 'Language: 4'