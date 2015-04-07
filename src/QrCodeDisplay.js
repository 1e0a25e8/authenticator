define(['react/react'], function(React) {

    return React.createClass({
        render: function() {
            return <img src={this.props.url} />;
        }
    });

});
