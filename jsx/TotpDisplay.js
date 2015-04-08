define(['react/react', 'totp'], function(React, TOTP) {

    return React.createClass({

        componentWillMount: function() {
            this.totp = new TOTP(this.props.otp.secret);

            $(this.totp).on('otpUpdated', (function(ev, authCode) {
                this.setState({
                    authCode: authCode
                });
            }).bind(this));

            this.totp.startTimer();
        },

        componentWillUnmount: function() {
            this.totp.stopTimer();
        },

        render: function() {
            return (
                <ul>
                    <li>Issuer: {this.props.otp.issuer}</li>
                    <li>Account: {this.props.otp.account}</li>
                    <li>Time-based auth code: {this.state.authCode}</li>
                </ul>
            );
        }
    });

});