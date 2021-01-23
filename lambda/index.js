/* *
 * This sample demonstrates handling intents from an Alexa skill using the Alexa Skills Kit SDK (v2).
 * Please visit https://alexa.design/cookbook for additional examples on implementing slots, dialog management,
 * session persistence, api calls, and more.
 * */
const Alexa = require('ask-sdk-core');
const i18n = require('i18next');
const util = require('./util');
const constants = require('./constants');
const logic = require('./logic');
const interceptors = require('./interceptors');




//const languageStrings = require('./interactionModel/customs/fr-FR.json');
const languageStrings = {
    en: {
        translation: {
            WELCOME_MSG: 'Welcome, you can say Hello or Help, which would you like to try ?',
            HELLO_MSG: 'Hello World!',
            HELP_MSG: 'You can say Hello to me ! How can I help ?',
            GOODBYE_MSG: 'Goodbye !',
            REGISTER_MSG: 'Your team is {{team}} from {{citySlot}} with {{trophies}} trophées.',
            FALLBACK_MSG: 'Sorry, I don\t know about that. Please try again',
            ERROR_MSG: 'Sorry, there was an error. Please try again'
        }
    },
    fr: {
        translation: {
            WELCOME_MSG: 'Bienvenue sur la Skill Football Base.',
            HELLO_MSG: 'Bonjour à toi!',
            HELP_MSG: 'Je peux me souvenir de votre équipe favorite, ou bien dites moi simplement : enregistre mon équipe favorite ',
            FALLBACK_MSG: 'Désolé, je ne sais pas. Pouvez vous reformuler ?',
            REGISTER_MSG: 'Votre équipe est {{team}} de {{citySlot}} avec {{trophies}} trophées.',
            ERROR_MSG: 'Désolé, je n\'ai pas compris. Pouvez vous reformuler ?',
            PROGRESSIVE_MSG: "Je recherche actuellement...",
            API_ERROR_MSG: "Désolé, je n'arrive pas à me connecter à l'API externe pour obtenir des résultats. Veuillez réessayer plus tard. ",
            POST_SCORER_HELP_MSG: " Veuillez poser une autre question ",
            REPROMPT_MSG: "Pour obtenir plus d'informations sur ce que je peux faire pour vous, demandez moi de l'aide. Si vous voulez quitter la skill, dites simplement 'stop'. ",
            REGISTER: "L'équipe est enregistrée.",
            MISSING_MSG: "Il n'y a pas d'équipe", 
            SAY_CLUBA : "Les équipes sont {{A}}",
            SAY_CLUBB: "Les équipes sont {{B}}",
            SAY_CLUBC : "Les équipes sont {{C}}",
            SAY_CLUBD : "Les équipes sont {{D}}",
            GOODBYE_MSG: ['Au revoir {{name}}!', 'A bientôt {{name}}', 'A la prochaine fois {{name}}']
        }
    }
}


const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
    },
    handle(handlerInput) {
        let speechText = handlerInput.t('WELCOME_MSG');
        return handlerInput.responseBuilder
            .speak(speechText)
            .reprompt(speechText)
            .getResponse();
    }
};

const persistenceAdapter = util.getPersistenceAdapter();

const RegisterFavoriteTeamHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'RegisterFavoriteTeam';
    },
    handle(handlerInput) {
        const {requestEnvelope, responseBuilder, attributesManager, t} = handlerInput;
        const sessionAttributes = attributesManager.getSessionAttributes();
        const {intent} = requestEnvelope.request;
        let speakOutput = handlerInput.t('REJECTED_MSG');
        
        if (intent.confirmationStatus === 'CONFIRMED') {
            const team = Alexa.getSlotValue(requestEnvelope, 'team');
            const citySlot = Alexa.getSlotValue(requestEnvelope, 'citySlot');
            // we get the slot instead of the value directly as we also want to fetch the id
            const trophies = Alexa.getSlotValue(requestEnvelope, 'trophies');
            //const teamName = team.value;
            //const month = trophies.resolutions.resolutionsPerAuthority[0].values[0].value.id
            
            sessionAttributes['team'] = team;
            sessionAttributes['citySlot'] = citySlot;
            sessionAttributes['trophies'] = trophies;
            // we can't use intent chaning because target intent is not dialog based
            speakOutput = handlerInput.t('REGISTER');
            return SayMyFavoriteTeamIntentHandler.handle(handlerInput);
        } 
        else { 
            const repromptText = handlerInput.t('HELP_MSG');
            responseBuilder.reprompt(repromptText);
        }

        return handlerInput.responseBuilder
            .speak(speakOutput)
            //.reprompt('add a reprompt if you want to keep the session open for the user to respond')
            .getResponse();
    }
};

const SayMyFavoriteTeamIntentHandler = {
    canHandle({requestEnvelope}) {
        return Alexa.getRequestType(requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(requestEnvelope) === 'SayMyFavoriteTeamIntent';
    },
    handle(handlerInput) {
        const {t, responseBuilder, attributesManager} = handlerInput
        const sessionAttributes = attributesManager.getSessionAttributes();
        const team = sessionAttributes['team'];
        const citySlot = sessionAttributes['citySlot'];
        const trophies = sessionAttributes['trophies'];
        
        let speechText = '';
        const teamAvailable = team && citySlot && trophies;

        if (teamAvailable) {
            speechText = handlerInput.t('REGISTER_MSG', {team: team, citySlot: citySlot, trophies: trophies})
        } else {
            speechText += t('MISSING_MSG');
            // we use intent chainng to trigger the birthday registration multi-turn
            responseBuilder.addDelegateDirective({
                name: 'RegisterBirthdayIntent',
                confirmationStatus: 'NONE',
                slots:{}
            })
        }
        return responseBuilder
            .speak(speechText)
            .reprompt(t('REPROMPT_MSG'))
            .getResponse();
    }
}

const ChampionsLeagueClubIntentHandler = {
    canHandle({requestEnvelope}) {
        return Alexa.getRequestType(requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(requestEnvelope) === 'ChampionsLeagueClubIntent';
    },
    handle(handlerInput) {
        const {t, responseBuilder, attributesManager, requestEnvelope} = handlerInput
        const sessionAttributes = attributesManager.getSessionAttributes();
        const teamsValues = Alexa.getSlotValue(requestEnvelope, 'poules');

        let speechText = '';
        const request = handlerInput.requestEnvelope.request;
        let slotValues = getSlotValues(request.intent.slots);
        var teams = slotValues.poules.resolved;

        if (teamsValues) {

            switch(teams) {
                case "A" :
                    speechText = facts[teams][0];
                break; 
                case "B" :
                    speechText = facts[teams][0];
                break; 
                case "C" :
                    speechText = facts[teams][0];
                break; 
                case "D" :
                    speechText = facts[teams][0];
                break; 
                default:
                    speechText = t('ERROR_MSG');
            }
        }
        else {
            speechText += t('MISSING_MSG');
        }
    return responseBuilder
        .speak(speechText)
        .reprompt(t('REPROMPT_MSG'))
        .getResponse();
    }
}

const SayBestScorerIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'SayBestScorerIntent';
    },
    async handle(handlerInput) {
        const {attributesManager, requestEnvelope, responseBuilder, t} = handlerInput;
        /*const sessionAttributes = attributesManager.getSessionAttributes();
        const {intent} = requestEnvelope.request;
        const name = sessionAttributes['name'];
        const timezone = sessionAttributes['timezone'];
        /*if (!timezone) {
            // timezone = 'Europe/Paris'; // so it works on the simulator, you should uncomment this line, replace with your time zone and comment sentence below
            return responseBuilder.speechText(t('NO_TIMEZONE_MSG')).getResponse();
        }
        try {
            // Call the progressive response serviceClientFactory
            await util.callDirectiveService(handlerInput, t('PROGRESSIVE_MSG'), {name});
        } catch (error) {
            // If it fails, we can continue, but the user will wait without progressive response
            console.log('Progressive response directive error :', error);
        }*/
        // we'll now fetch celebrity birthdays from external API
        const response = await logic.httpGet();
        let speechText;
        console.log(response);
        if (response)
            speechText = "Les meilleurs buteurs de Premier League sont " + (response.topscorers[0].player_name) + ", " + (response.topscorers[1].player_name) + ", " + response.topscorers[2].player_name + " avec " + response.topscorers[2].goals.total + " buts chacun. ";
        else 
            handlerInput.t('API_ERROR_MSG');
        speechText += handlerInput.t('POST_SCORER_HELP_MSG')
        return handlerInput.responseBuilder
            .speak(speechText)
            .reprompt(handlerInput.t('REPROMPT_MSG'))
            .getResponse();
    }
};

const HelpIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.HelpIntent';
    },
    handle(handlerInput) {
        const speakOutput = 'You can say hello to me! How can I help?';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

const CancelAndStopIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && (Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.CancelIntent'
                || Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.StopIntent');
    },
    handle(handlerInput) {
        const {t, attributesManager} = handlerInput;
        const sessionAttributes = attributesManager.getSessionAttributes();
        const name = sessionAttributes['name']
        const speakOutput = t('GOODBYE_MSG', {name});

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .getResponse();
    }
};
/* *
 * FallbackIntent triggers when a customer says something that doesn’t map to any intents in your skill
 * It must also be defined in the language model (if the locale supports it)
 * This handler can be safely added but will be ingnored in locales that do not support it yet 
 * */
const FallbackIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.FallbackIntent';
    },
    handle(handlerInput) {
        const speakOutput = 'Sorry, I don\'t know about that. Please try again.';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};
/* *
 * SessionEndedRequest notifies that a session was ended. This handler will be triggered when a currently open 
 * session is closed for one of the following reasons: 1) The user says "exit" or "quit". 2) The user does not 
 * respond or says something that does not match an intent defined in your voice model. 3) An error occurs 
 * */
const SessionEndedRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'SessionEndedRequest';
    },
    handle(handlerInput) {
        console.log(`~~~~ Session ended: ${JSON.stringify(handlerInput.requestEnvelope)}`);
        // Any cleanup logic goes here.
        return handlerInput.responseBuilder.getResponse(); // notice we send an empty response
    }
};
/* *
 * The intent reflector is used for interaction model testing and debugging.
 * It will simply repeat the intent the user said. You can create custom handlers for your intents 
 * by defining them above, then also adding them to the request handler chain below 
 * */
const IntentReflectorHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest';
    },
    handle(handlerInput) {
        const intentName = Alexa.getIntentName(handlerInput.requestEnvelope);
        const speakOutput = `You just triggered ${intentName}`;

        return handlerInput.responseBuilder
            .speak(speakOutput)
            //.reprompt('add a reprompt if you want to keep the session open for the user to respond')
            .getResponse();
    }
};
/**
 * Generic error handling to capture any syntax or routing errors. If you receive an error
 * stating the request handler chain is not found, you have not implemented a handler for
 * the intent being invoked or included it in the skill builder below 
 * */
const ErrorHandler = {
    canHandle() {
        return true;
    },
    handle(handlerInput, error) {
        const speakOutput = 'Sorry, I had trouble doing what you asked. Please try again.';
        console.log(`~~~~ Error handled: ${JSON.stringify(error)}`);

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

function getSlotValues(filledSlots) {
  const slotValues = {};

  Object.keys(filledSlots).forEach((item) => {
    const name = filledSlots[item].name;
    slotValues[name] = {};

    // Extract the nested key 'code' from the ER resolutions in the request
    let erStatusCode;
    try {
      erStatusCode = ((((filledSlots[item] || {}).resolutions ||
        {}).resolutionsPerAuthority[0] || {}).status || {}).code;
    } catch (e) {
      console.log('erStatusCode e:' + e)
    }

    switch (erStatusCode) {
      case 'ER_SUCCESS_MATCH':
        slotValues[name].synonym = filledSlots[item].value;
        slotValues[name].resolved = filledSlots[item].resolutions
          .resolutionsPerAuthority[0].values[0].value.name;
        slotValues[name].isValidated = filledSlots[item].value ===
          filledSlots[item].resolutions.resolutionsPerAuthority[0].values[0].value.name;
        slotValues[name].ERstatus = erStatusCode;
        break;

      default: // ER_SUCCESS_NO_MATCH, undefined
        slotValues[name].synonym = filledSlots[item].value;
        slotValues[name].resolved = filledSlots[item].value;
        slotValues[name].isValidated = false;
        slotValues[name].ERstatus = erStatusCode === undefined ? 'undefined' : erStatusCode;
        break;
    }
  }, this);

  return slotValues;
}


const LocalisationRequestInterceptor = {
    process(handlerInput) {
        const localisationClient = i18n.init({
            // lng: handlerInput.requestEnvelope.request.locale,
            lng: Alexa.getLocale(handlerInput.requestEnvelope),
            resources: languageStrings,
            returnObjects: true
        })
        localisationClient.localise = (...args) => {
            const value = i18n.t(...args);
            if (Array.isArray(value)) {
                return value[Math.floor(Math.random() * value.length)];
            }
            return value;
        }
        handlerInput.t = (...args) => localisationClient.localise(...args)
    }
  };


const facts = {
  "A":
    [
      "Bayern Munich, Athletico Madrid, Red Bull Salzburg, Lokomotiv Moscou",
    ],
  "B":
    [
      "Inter Milan, Shakhtar Donetsk, Mönchengladbach, Real Madrid"
    ],
  "C":
    [
      "Manchester City, FC Porto, Olympiakos, Olympique de Marseille"
    ],
  "D":
    [
      "Liverpool, Atalanta, Ajax, FC Midtjylland"
    ]
};

/**
 * This handler acts as the entry point for your skill, routing all request and response
 * payloads to the handlers above. Make sure any new handlers or interceptors you've
 * defined are included below. The order matters - they're processed top to bottom 
 * */
exports.handler = Alexa.SkillBuilders.custom()
    .addRequestHandlers(
        LaunchRequestHandler,
        RegisterFavoriteTeamHandler,
        SayBestScorerIntentHandler,
        SayMyFavoriteTeamIntentHandler,
        ChampionsLeagueClubIntentHandler,
        HelpIntentHandler,
        CancelAndStopIntentHandler,
        FallbackIntentHandler,
        SessionEndedRequestHandler,
        IntentReflectorHandler)
    .addErrorHandlers(
        ErrorHandler)
    .addRequestInterceptors(
        LocalisationRequestInterceptor,
        interceptors.LoadAttributesRequestInterceptor,
        interceptors.LoadNameRequestInterceptor)
    .addResponseInterceptors(
        interceptors.SaveAttributesResponseInterceptor)
    .withCustomUserAgent('sample/hello-world/v1.2')
    .withPersistenceAdapter(persistenceAdapter)
    .withApiClient(new Alexa.DefaultApiClient())
    .lambda();