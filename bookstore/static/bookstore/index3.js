const ERRORIMAGE = "https://merriam-webster.com/assets/mw/images/article/art-wap-landing-mp-lg/egg-3442-4c317615ec1fd800728672f2c168aca5@1x.jpg";

function Book(props){
    const onclick_event = () => {
        props.self.setState(prevState => {return {index: props.book.id, page: "getbook"}});
    }
    return(
        <div>
            <ul onClick={onclick_event} style={{listStyleTtype: "none",
                margin: "0",
                padding: "0",
                overflow: "hidden",
                cursor: "pointer"}}>
                <li style={{float: "left", display: "block", width: "20vw"}}> {props.book.name}</li>
                <li style={{float: "left", display: "block", width: "20vw"}}> {props.book.category}</li>
                <li style={{float: "left", display: "block", width: "20vw"}}> {props.book.author} </li>
                </ul>
        </div>
    )
}


class App extends React.Component{
    constructor(props){
        super(props);
        this.state = {
            page: "booklist",
            username: null,
            access_key: null,
            refresh_key: null,
            username: null,
            userid: null,
            booklist: [],
            index: 1,
            bookinfo: null,
            comments: null,
            is_watchlisted: false,
        };
        this.login = this.login.bind(this);
        this.logout = this.logout.bind(this);
        this.register = this.register.bind(this);
        this.handleLoginSubmit = this.handleLoginSubmit.bind(this);
        this.handleRegisterSubmit = this.handleRegisterSubmit.bind(this);
        this.newBookSubmit = this.newBookSubmit.bind(this);
        this.get_booklist = this.get_booklist.bind(this);
        this.refresh = this.refresh.bind(this);
        this.getbook = this.getbook.bind(this);
        this.submitComment = this.submitComment.bind(this);
        this.editBook = this.editBook.bind(this);
        this.editpage = this.editpage.bind(this);
        this.bookpage = this.bookpage.bind(this);
        this.toggleWatchlist = this.toggleWatchlist.bind(this);
        this.getWatchlist = this.getWatchlist.bind(this);

        var data = window.sessionStorage.getItem("JWT_keys");
        const data2 = window.sessionStorage.getItem("username");
        if ((data != null) && (data2 != null)){
            data = JSON.parse(data);
        if ((data.access != null) && (data.refresh != null)) {
            this.state.access_key = data.access;
            this.state.refresh_key = data.refresh;
            this.state.page = "booklist";
            this.state.username = data2;
        }}
        this.get_booklist([]);

    }
    logout(){
        window.sessionStorage.removeItem("JWT_keys");
        window.sessionStorage.removeItem("usernmae");
        this.setState(prevState => {return {username: null, access_key: null, refresh_key: null, page: "booklist"}});
    }
    login(){
        this.setState(prevState => {return {page: "login"}});
    }
    bookpage(){
        this.setState(prevState => {return {page: "bookpage"}});
    }
    editpage(){
        this.setState(prevState => {return {page: "editpage"}});
    }
    register(){
        this.setState(prevState => {return {page: "register"}});
    }
    async refresh(refresh_key){
        let status = 200;
        return await fetch("/api/token/refresh/",{
            method: "POST",
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
              },
            body:JSON.stringify({"refresh": refresh_key})
        }).then(res => {
            status = res.status; return res.json();
        }).then(data => {
            data.refresh = refresh_key;
            if (status == 200){
            window.sessionStorage.setItem("JWT_keys", JSON.stringify(data));}
            return data;
        })
    }
    getbook(second_turn){
        let status = 200;
        fetch("/api/booklist/" + this.state.index + "/", {
            method: "GET"
        }).then(res => {return res.json();
        }).then(data => {
            fetch("/api/comments/?book=" + this.state.index,{
                method: "GET"
            }).then(res => {return res.json();
            }).then(comments => {
                fetch("/api/watchlist/" + this.state.index + "/", {
                    method: "GET",
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                        "Authorization": "Bearer " + this.state.access_key,
                      },
                }).then(res => {status = res.status; return res.json()
                }).then(out => {
                    if (status != 200){
                        if (status == 401){
                            if (second_turn == null || second_turn == undefined){
                            this.refresh(this.state.refresh_key).then(x =>{
                                this.state.refresh_key = x.refresh;
                                this.state.access_key = x.access
                                this.getbook(true)
                                return});
                            return;
                            }
                            else if(this.state.username != null){
                                this.logout();
                                return;
                            }
                            
                        }
                        this.setState(prevState => {return {bookinfo: data, comments:comments, page: "bookpage"}});
                        return
                    }
                    this.setState(prevState => {return {bookinfo: data, comments:comments, is_watchlisted:out.is_watchlisted, page: "bookpage"}});
                });
            });
        });
    }
    handleLoginSubmit(event){
        var status = 201;
        fetch("/api/token/",{
            method: "POST",
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
              },
            body:JSON.stringify({"username": event.target[0].value, "password": event.target[1].value})
        }).then(res => {status = res.status; return res.json();
        }).then(data => {
            if (status != 200){
                alert("Wrong Credentials")
                return
            }
            window.sessionStorage.setItem("JWT_keys", JSON.stringify(data));
            window.sessionStorage.setItem("username", event.target[0].value)
            this.setState(prevState => {return {username: event.target[0].value, access_key: data.access, refresh_key:data.refresh, page: "booklist"}});
        });
        event.preventDefault();
    }
    handleRegisterSubmit(event){
        event.preventDefault();
        const username = event.target[0].value;
        const email = event.target[1].value;
        const password = event.target[2].value;
        const password2 = event.target[3].value;
        var self = this;
        var status = 200;
        if ((password != password2) || (password.length == 0)){
            alert("Passwords does not match.");
            return;
        }
        if (((username).length < 1) || ((username).length > 32)){
            alert("Invalid username length");
            return;
        }
        if ((email.length < 1) || ((email).length > 64)){
            alert("Invalid email length");
            return;
        }
        const data = {"username": username, "password": password, "email": email};
        fetch("/api/usercreate/",{
            method: "POST",
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
              },
            body:JSON.stringify(data)
        }).then(res => {status = res.status; return res.json();
        }).then(d => {
            if (status != 201){
                if (d.email) alert(d.email);
                else if (d.username) alert(d.username);
                else if (d.password) alert(d.password);
                else
                alert("Invalid data")
                return
            }
            fetch("/api/token/",{
                method: "POST",
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                  },
                body:JSON.stringify(data)
            }).then(res => {return res.json();
            }).then(value => {
                window.sessionStorage.setItem("JWT_keys", JSON.stringify(value));
                window.sessionStorage.setItem("username", username)
                self.setState(prevState => {return {access_key: value.access, refresh_key: value.refresh, page: "booklist"}});
            });
        });
    }
    submitComment(event){
        event.preventDefault();
        const bookid = this.state.index;
        const comment = event.target[0].value;
        const dat = {Book: bookid, Comment: comment}
        let status = 201;
        fetch("/api/comments/", {
            method: "POST",
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                "Authorization": "Bearer " + this.state.access_key,
              },
            body: JSON.stringify(dat),
        }).then(res => {status = res.status; return res.json();
        }).then(d => {
            if (status != 201){
                if (status == 401){
                    if (event.tried_refresh == null){
                    this.refresh(this.state.refresh_key).then(data =>{
                        this.state.refresh_key = data.refresh;
                        this.state.access_key = data.access
                        event.tried_refresh = true;
                        this.submitComment(event)
                        return});
                    return;
                    }
                    else{
                        this.logout();
                        return;
                    }
                    
                }
                alert("Unvalid info or authorization")
                return
            }
            this.setState(prevState => {return {page: "getbook"}});
        })
    }
    get_booklist(event){
        let data;
        try{
            data = {name: event.target.form[0].value, category: event.target.form[1].value, author: event.target.form[2].value};
        }
        catch(e){
            data = {name: "", category: "", author: ""};
        }
        fetch("/api/booklist/?" + new URLSearchParams(data),{
            method: "GET",
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                
              }
        }).then(res => {return res.json();
        }).then(d => {
            this.setState(prevState => {return {booklist: d, page: "booklist"}});
        });//"Authorization": "Bearer " + this.state.access_key
    }
    editBook(event){
        event.preventDefault();
        const img = event.target[0].value;
        const name = event.target[1].value;
        const cat = event.target[2].value;
        const aut = event.target[3].value;
        const loc = event.target[4].value;
        const pub = event.target[5].value;
        const desc = event.target[6].value;
        let status = 201;
        if ((name.length < 1) || ((name).length > 32)){
            alert("Invalid name length");
            return;
        }
        else if ((cat.length < 1) || ((cat).length > 32)){
            alert("Invalid cat length");
            return;
        }
        else if ((aut.length < 1) || ((aut).length > 32)){
            alert("Invalid aut length");
            return;
        }
        else if ((img.length < 1) || ((img).length > 1024)){
            alert("Invalid img length");
            return;
        }
        else if ((loc.length < 1) || ((loc).length > 32)){
            alert("Invalid loc length");
            return;
        }
        else if ((pub.length < 1) || ((pub).length > 32)){
            alert("Invalid pub length");
            return;
        }
        else if ((desc.length < 1) || ((desc).length > 256)){
            alert("Invalid desc length");
            return;
        }
        const data = {Name: name, Category: cat, Author: aut, Description: desc, Location: loc, Pic_url: img, Publisher: pub};
        fetch("/api/booklist/" + this.state.index + "/", {
            method: "PUT",
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                "Authorization": "Bearer " + this.state.access_key,
              },
            body: JSON.stringify(data),
        }).then(res => {status = res.status; return res.json();
        }).then(d => {
            if (status != 200){
                if (status == 401){
                    if (event.tried_refresh == null){
                    this.refresh(this.state.refresh_key).then(data =>{
                        this.state.refresh_key = data.refresh;
                        this.state.access_key = data.access
                        event.tried_refresh = true;
                        this.editBook(event)
                        return});
                    return;
                    }
                    else{
                        this.logout();
                        return;
                    }
                }
                console.log(d)
                alert("Unvalid info or authorization")
                return
            }
            this.setState(prevState => {return {index: d.id, page: "getbook"}});
        });
    }
    newBookSubmit(event){
        event.preventDefault();
        const name = event.target[0].value;
        const cat = event.target[1].value;
        const aut = event.target[2].value;
        const img = event.target[3].value;
        const loc = event.target[4].value;
        const pub = event.target[5].value;
        const desc = event.target[6].value;
        let status = 201;
        if ((name.length < 1) || ((name).length > 32)){
            alert("Invalid name length");
            return;
        }
        else if ((cat.length < 1) || ((cat).length > 32)){
            alert("Invalid cat length");
            return;
        }
        else if ((aut.length < 1) || ((aut).length > 32)){
            alert("Invalid aut length");
            return;
        }
        else if ((img.length < 1) || ((img).length > 1024)){
            alert("Invalid img length");
            return;
        }
        else if ((loc.length < 1) || ((loc).length > 32)){
            alert("Invalid loc length");
            return;
        }
        else if ((pub.length < 1) || ((pub).length > 32)){
            alert("Invalid pub length");
            return;
        }
        else if ((desc.length < 1) || ((desc).length > 256)){
            alert("Invalid desc length");
            return;
        }
        const data = {Name: name, Category: cat, Author: aut, Description: desc, Location: loc, Pic_url: img, Publisher: pub};
        fetch("/api/booklist/", {
            method: "POST",
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                "Authorization": "Bearer " + this.state.access_key,
              },
            body: JSON.stringify(data),
        }).then(res => {status = res.status; return res.json();
        }).then(d => {
            if (status != 201){
                if (status == 401){
                    if (event.tried_refresh == null){
                    this.refresh(this.state.refresh_key).then(data =>{
                        this.state.refresh_key = data.refresh;
                        this.state.access_key = data.access
                        event.tried_refresh = true;
                        this.newBookSubmit(event)
                        return});
                    return;
                    }
                    else{
                        this.logout();
                        return;
                    }
                    
                }
                alert("Unvalid info or authorization")
                return
            }
            this.setState(prevState => {return {index: d.id, page: "getbook"}});
        });
        
    }
    toggleWatchlist(second_turn){
        let status = 200;
        const method = this.state.is_watchlisted ? "DELETE" : "POST"
        const data = {books: this.state.index}
        const dat = this.state.is_watchlisted ? "" + this.state.index + "/": "";
        fetch("/api/watchlist/" + dat,  {
            method: method,
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                "Authorization": "Bearer " + this.state.access_key,
              },
            body: JSON.stringify(data),
        }).then(res => {status = res.status; return res
        }).then(out => {
            if (status != 201 && status != 204){
                if (status == 401){
                    if (second_turn == null || second_turn == undefined){
                    this.refresh(this.state.refresh_key).then(data =>{
                        this.state.refresh_key = data.refresh;
                        this.state.access_key = data.access
                        this.newBookSubmit(true)
                        return});
                    return;
                    }
                    else{
                        this.logout();
                        return;
                    }
                }
                alert("Unvalid info or authorization")
                return
            }
            this.setState(prevState => {return {page: "getbook"}});
        }) 
    }
    getWatchlist(second_turn){
        let status = 200;
        fetch("/api/watchlist/",  {
            method: "GET",
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                "Authorization": "Bearer " + this.state.access_key,
              }
            }).then(res => {status = res.status; return res.json()
            }).then(data => {
                if (status != 200){
                    if (status == 401){
                        if (second_turn == null || second_turn == undefined){
                        this.refresh(this.state.refresh_key).then(x =>{
                            this.state.refresh_key = x.refresh;
                            this.state.access_key = x.access
                            this.getbook(true)
                            return});
                        return;
                        }
                        else{
                            this.logout();
                            return;
                        }
                        
                    }
                    alert(data)
                    return
                }
                this.setState(prevState => {return {booklist: data, page: "mywatchlist"}});
            })
    }
    render(){
        let out = [];
        if(this.state.access_key != null) {
            out.push(<p> Welcome {this.state.username} </p>);
            out.push(<p style={{cursor: "pointer"}} onClick={() => this.setState(prevState => {return {page: "newbook"}})}>New Book</p>);
            out.push(<p style={{cursor: "pointer"}} onClick={this.getWatchlist}>My Watchlist</p>);
            out.push(<p style={{cursor: "pointer"}} onClick={this.logout}>logout</p>);
        }
        else {
            if(this.state.page != "register"){
                out.push(<ul><li style={{cursor: "pointer"}} onClick={this.login}> Login </li> <li style={{cursor: "pointer"}} onClick={this.register}> Register </li></ul>);
            }
        }
        if(this.state.page == "newbook"){
            out.push(<form onSubmit={this.newBookSubmit} style={{display: "Flex", flexDirection: "Column"}}>
                <label>Book Name: <input name="name" placeholder="Name"/></label>
                <label>Book Category: <input name="cat" placeholder="Category"/></label>
                <label>Book Author: <input name="aut" placeholder="Author"/></label>
                <label>Book Image: <input name="img" placeholder="URL"/></label>
                <label>Book Location: <input name="loc" placeholder="Location"/></label>
                <label>Book Publisher: <input name="pub" placeholder="Publisher"/></label>
                <label>Book Description: <textarea style={{width: "30vw"}} type="submit" name="desc" placeholder="Description"/></label>
                <input style={{width: "10vw"}} type="submit"/>
            </form>)
        }
        else if (this.state.page == "editpage"){
            if(this.state.bookinfo == null) out.push(<p> Book cannot be found</p>)
            else{
                out.push(<button onClick={this.bookpage}>Go back</button>)
                out.push(<form onSubmit={this.editBook}>
                        <label>imageurl: <input name="url" defaultValue={this.state.bookinfo.Pic_url}/> </label>
                        <label>Bookname: <input name="name" defaultValue={this.state.bookinfo.Name}/></label>
                        <label>Category: <input name="cat" defaultValue={this.state.bookinfo.Categoryy}/></label>
                        <label>Author: <input name="aut" defaultValue={this.state.bookinfo.Authorr}/></label>
                        <label>Location: <input name="loc" defaultValue={this.state.bookinfo.Location}/></label>
                        <label>Publisher: <input name="pub" defaultValue={this.state.bookinfo.Publisherr}/></label>
                        <label>Description: <textarea>{this.state.bookinfo.Description}</textarea></label>
                        <input type="submit"/>
                    </form>);
            }
        }
        else if(this.state.page == "bookpage"){
            if(this.state.bookinfo == null) out.push(<p> Book cannot be found</p>)
            else{
                if(this.state.bookinfo.listerr == this.state.username){
                    out.push(<button onClick={this.editpage}>Edit</button>)
                }
                if(this.state.username != null) out.push(<button onClick={this.toggleWatchlist}>{this.state.is_watchlisted ? "Unwatch" : "Watch"}</button>)
                out.push(<div class="post">
                        <img style={{width: "256px", height: "256px"}} src={this.state.bookinfo.Pic_url} onError={(e)=>{e.target.onerror = null; e.target.src=ERRORIMAGE;}}></img>
                        <p>Bookname: {this.state.bookinfo.Name}</p>
                        <p>Lister: {this.state.bookinfo.listerr}</p>
                        <p>Category: {this.state.bookinfo.Categoryy}</p>
                        <p>Author: {this.state.bookinfo.Authorr}</p>
                        <p>Location: {this.state.bookinfo.Location}</p>
                        <p>Publisher: {this.state.bookinfo.Publisherr}</p>
                        <p>List Date: {this.state.bookinfo.Date}</p>
                        <p>Description: {this.state.bookinfo.Description}</p>
                    </div>);
                let temp = [];
                this.state.comments.forEach(comment => {
                    temp.push(
                        <li><label>{comment.timestamp}<p>{comment.Commentor} {comment.comment}</p></label> </li>
                   )
                });
                out.push(
                    <h1> Comments </h1>
                );
                out.push(<ul>{temp}</ul>);
                if (this.state.access_key != null){
                    out.push(<h3> Write a comment</h3>);
                    out.push(<form onSubmit={this.submitComment}>
                        <textarea/>
                        <input type="submit"/>
                    </form>)
                }
            }
        }
        else if(this.state.page == "getbook"){
            this.getbook();
        }
        else if(this.state.page == "mywatchlist"){
            out.push(<h3> My Watchlist</h3>)
            out.push(<ul style={{listStyleTtype: "none",
                margin: "0",
                padding: "0",
                overflow: "hidden",}}>
                <li style={{float: "left", display: "block", width: "20vw"}}> Name</li>
                <li style={{float: "left", display: "block", width: "20vw"}}> Category</li>
                <li style={{float: "left", display: "block", width: "20vw"}}> Author </li>
                </ul>);
            let temp = [];
            this.state.booklist.forEach(book => {
                temp.push(<Book book={book} self={this}/>);
            });
            out.push(<ul> {temp}</ul>)
        }
        else if(this.state.page == "booklist"){
            out.push(<ul style={{listStyleTtype: "none",
                margin: "0",
                padding: "0",
                overflow: "hidden",}}>
                <li style={{float: "left", display: "block", width: "20vw"}}> Name</li>
                <li style={{float: "left", display: "block", width: "20vw"}}> Category</li>
                <li style={{float: "left", display: "block", width: "20vw"}}> Author </li>
                </ul>);
            out.push(<form onKeyUp={this.get_booklist} style={{listStyleTtype: "none",
                margin: "0",
                padding: "0",
                overflow: "hidden",}}>
                <input style={{float: "left", display: "block", width: "20vw"}} placeholder="Name"/>
                <input style={{float: "left", display: "block", width: "20vw"}} placeholder="Category"/>
                <input style={{float: "left", display: "block", width: "20vw"}} placeholder="Author"/>
                </form>);
            let temp = [];
            this.state.booklist.forEach(book => {
                temp.push(<Book book={book} self={this}/>);
            });
            out.push(<ul> {temp}</ul>)
            
        }
        else if(this.state.page == "login"){
            out.push(<form onSubmit={this.handleLoginSubmit}>
                <label>
                  Username:
                  <input name="username" type="text" placeholder="username" />
                </label>
                <label>
                  Password:
                  <input name="password" type="password" placeholder="password"/>
                </label>
                <input type="submit" value="Submit" />
              </form>);
        }
        else if(this.state.page == "register"){
            out.push(<form style={{display: "Flex", flexDirection: "Column"}} onSubmit={this.handleRegisterSubmit}>
                <label>
                  Username:
                  <input name="username" type="text" placeholder="username" />
                </label>
                <label>
                  Email:
                  <input name="email" type="text" placeholder="email" />
                </label>
                <label>
                  Password:
                  <input name="password" type="password" placeholder="password"/>
                </label>
                <label>
                  Password confirmation:
                  <input name="password2" type="password" placeholder="password"/>
                </label>

                <input style={{width: "10vw"}} type="submit" value="Submit" />
              </form>);
            out.push(<p style={{display: "inline-Flex"}}>Do you have an account? <p style={{paddingLeft: "8px", cursor: "pointer"}} onClick={this.login}> Login </p></p>)
        }
        //else if 
        return(out);
    }
}
ReactDOM.render(<App/>, document.querySelector("#app"));