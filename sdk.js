//import Widget, { configuration, component, journey, user } from  "https://unpkg.com/@forgerock/login-widget@1.1.0-beta.2" 

import Widget, { configuration, component, journey, user } from  "https://unpkg.com/@forgerock/login-widget" 


window.sdkInit = () => {
    const myConfig = configuration();

    // Configure ForgeRock ID Cloud tenant details
    // See: https://backstage.forgerock.com/docs/sdks/latest/javascript/webloginframework/tutorial.html

    myConfig.set({
        forgerock: {
            serverConfig: {
                baseUrl: CONFIG.tenant + '/am/',
                timeout: 3000
            },
            clientId: CONFIG.client.id,
            realmPath: 'alpha',
            redirectUri: CONFIG.redirectUri,
            scope: CONFIG.scope
        },
        content: {
            userName: 'User Name',
            passwordCallback: 'Password',
            nextButton: 'Next'
        },
        style: {
            checksAndRadios: 'animated',
            labels: 'floating',
            logo: {
                dark: 'https://media.istockphoto.com/id/500613911/photo/leaf.jpg?s=612x612&w=0&k=20&c=205Zg_eaNME5Bgn6szFR6gfucd-zC9hm8IEQ5r4nF1o=',
                light: 'https://media.istockphoto.com/id/500613911/photo/leaf.jpg?s=612x612&w=0&k=20&c=205Zg_eaNME5Bgn6szFR6gfucd-zC9hm8IEQ5r4nF1o=',
                height: 100,
                width: 100
            },
            sections: {
                header: false,
            },
            stage: {
                icon: false 
            }
        }
    });
}


window.inlineLogin = (userCallback, tokenCallback, failedCallback) => {
    var old = document.getElementsByClassName('fr_widget-root');
    for (let el of old) el.remove();
    
    new Widget({
        target: document.getElementById('inline-widget-root'),
        props: {
            type: 'inline'
        }
    });

    // Open login modal dialog
    const componentEvents = component();
    componentEvents.open();

    // Start listening for user events
    const userEvents = user.info();
    const unsubUserEvents = userEvents.subscribe((event) => {
        console.log('User Event '+ JSON.stringify(event));
        if (event.successful) {
            userCallback(event);
        }
    });

    // Start listening for token events
    const tokenEvents = user.tokens();
    const unsubTokenEvents = tokenEvents.subscribe((event) => {
        console.log('Token Event '+ JSON.stringify(event));
        if (event.successful) {
            tokenCallback(event);
        }
    });

    // Begin login
    const journeyEvents = journey();
    journeyEvents.subscribe((event) => {
        if (event.journey.error != null) {
          failedCallback(event);
        }
    });  
  
    journeyEvents.start({ 'journey': CONFIG.journey });
}


window.logout = () => {
    user.logout();               
}



