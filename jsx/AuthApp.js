define(['react/react', 'app/QrCodeDisplay', 'app/TotpDisplay', 'CryptoJS', 'jsSHA/sha1', 'StoreAnon'], 

    function(React, QrCodeDisplay, TotpDisplay, CryptoJS, jsSHA, StoreAnon) {

    return React.createClass({

        getInitialState: function(){
            return {
                currentStep: 1,
                qrCodeUrl: undefined,
                otp: undefined,
                encryptionPhrase: undefined,
                encryptedSecret: undefined
            }
        },

        render: function() {
            return (
                this.state.currentStep == 1?
                <section key="step-1">
                    <h2>Create...</h2>
                    <h4>paste your QR code URL or Data URI</h4>
                    <input type="text" value={this.state.qrCodeUrl} onChange={this.secretUrlUpdated} /><br/>
                    {
                        this.state.qrCodeUrl?
                            <QrCodeDisplay url={this.state.qrCodeUrl} />
                            :false
                    }
                    {
                        this.state.otp? 
                            <div>
                                <TotpDisplay otp={this.state.otp} />
                                <button onClick={this.step1done}>Looks good, continue...</button>
                                <button onClick={this.step1cancel}>Start over</button>
                            </div>
                             :false
                    }
                </section>
                : this.state.currentStep == 2?
                <section key="step-2">
                    <h4>Enter a phrase to encrypt your secret</h4>
                    <input type="password" value={this.state.encryptionPhrase} onChange={this.encryptionPhraseUpdated} /><br/>
                    {
                        this.state.encryptedSecret?
                        <div>
                            Your encrypted secret <small>(this is what we'll store on the server)</small>:<br/>
                            <span>{this.state.encryptedSecret}</span>
                        </div>
                        : false
                    }

                    <h4>Re-type your encryption secret</h4>
                    <input type="password" onChange={this.encryptionConfirmationUpdated} /><br />
                    {
                        this.state.decryptedSecret?
                            this.state.decryptedSecret == this.state.qrCodeUrl?
                                <div>
                                    OK, your encryption phrases match!
                                    Press the button to save your encrypted data to the cloud...
                                    <button onClick={this.step2done}>Continue...</button>
                                </div>
                                : <span style="color: red;">Keep typing...</span>
                            : <span>Please confirm your encryption phrase</span>
                    }
                </section>
                : this.state.currentStep == 3?
                <section key="step-3">
                    <p>
                        OK, now enter a lookup phrase. This is just used to locate your 
                        (anonymous) authentication data. It can be long or short as long
                        nobody else has used it and you remember it.
                    </p>

                    <input type="text" name="lookupPhrase1" onChange={this.lookupPhraseUpdated} /><br/>
                    <input type="text" name="lookupPhrase2" onChange={this.lookupPhraseUpdated} />

                    {
                        this.state.storageKey? 
                        <p>
                            OK! Your lookup phrase looks good... ({this.state.storageKey})
                            <button onClick={this.saveToCloud}>Ready to save?</button>
                        </p>
                        : false
                    }
                </section>
                :
                // "step-4" is not really a step - it's the Read mode of the app...
                <section key="step-4">
                    {
                        this.state.otp?
                        <TotpDisplay otp={this.state.otp} />
                        : <span>Loading your super secret TOTP data...</span>
                    }
                </section>

            );
        },

        step1done: function() {
            this.setState({
                currentStep: 2
            });
        },

        step1cancel: function() {
            this.replaceState(this.getInitialState());
        },

        step2done: function() {
            this.setState({
                currentStep: 3
            });
        },

        lookupPhraseUpdated: function() {
            var storageKey = undefined;
            var lookupPhrase1 = this.getDOMNode().querySelector('[name=lookupPhrase1]').value;
            var lookupPhrase2 = this.getDOMNode().querySelector('[name=lookupPhrase2]').value;

            if (lookupPhrase1 === lookupPhrase2) {
                var shaObj = new jsSHA(lookupPhrase1, "TEXT");
                storageKey = shaObj.getHash("SHA-1", "HEX");
            }

            this.setState({
                storageKey: storageKey
            });
        },

        saveToCloud: function(ev) {
            var lookupKey = this.state.storageKey;
            var encryptionPassphrase = this.state.encryptionPhrase;
            var newObject = this.state.otp;

            StoreAnon.storeObject(lookupKey, newObject, encryptionPassphrase).done((function(lookupKey) {
                // use a whole new state object because it's nice to clear
                // out all the in-progress data that we had during creation steps
                var newState = this.getInitialState();
                newState.currentStep = 4;
                this.setState(newState);
                this.loadTotp(lookupKey, encryptionPassphrase);
            }).bind(this)).fail(function(err) {
                throw 'save failed: ' + err;
            });
        },

        loadTotp: function(lookupKey, encryptionPassphrase) {
            StoreAnon.fetchObject(lookupKey, encryptionPassphrase).done((function(otp) {
                this.setState({
                    otp: otp
                });
            }).bind(this)).fail(function() {
                console.log('error getting totp info: %o', arguments);
                throw 'whoops'
            })
        },

        encryptionPhraseUpdated: function(ev) {
            var encryptionPhrase = ev.target.value;
            var encryptedSecret = undefined;
            if (encryptionPhrase) {

                var secret = this.state.qrCodeUrl;

                encryptedSecret = CryptoJS.AES.encrypt(secret, encryptionPhrase).toString();
            }

            this.setState({
                encryptedSecret: encryptedSecret
            });
        },

        encryptionConfirmationUpdated: function(ev) {
            var encryptionConfirmation = ev.target.value;

            var decryptedSecret = CryptoJS.AES.decrypt(this.state.encryptedSecret, encryptionConfirmation);

            try {
                decryptedSecret = decryptedSecret.toString(CryptoJS.enc.Utf8);
            } catch (e) {
                // if an error was thrown on this line, the decrypion failed.
                // set decryptedSecret to blank
                decryptedSecret = undefined;
            }

            this.setState({
                encryptionPhrase: encryptionConfirmation,
                decryptedSecret: decryptedSecret
            });
        },

        secretUrlUpdated: function(ev) {
            var qrCodeUrl = ev.target.value;

            qrcode.callback = (function(qrCodeData) {
                // otpauth://totp/Google%3Asomebody%40gmail.com?secret=p5ytcate53w3r5anysh3kuinuhz2b2wp&issuer=Google
                var otpAuthPattern = /otpauth\:\/\/totp\/(.*)/;
                var match = otpAuthPattern.exec(qrCodeData);
                if (!match) {
                    throw new Error('qrCode does not contain otpauth data: ' + qrCodeData);
                }

                var authData = match[1];
                authData = unescape(authData);
                // provider:emailaddress?secret=abcABC123[&issuer=Provider]
                var authDataPattern = /(.*):(.*)\?.*secret=(\w*)/;
                var authDataMatch = authDataPattern.exec(authData);

                this.setState({
                    otp: {
                        issuer: authDataMatch[1],
                        account: authDataMatch[2],
                        secret: authDataMatch[3]
                    }
                });
            }).bind(this);

            // TODO: wrap jsqrcode to better handle errors.
            var result = qrcode.decode(qrCodeUrl);

            this.setState({
                qrCodeUrl: qrCodeUrl
            });
        }
    });

});