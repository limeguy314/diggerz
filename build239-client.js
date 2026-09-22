'use strict';
(function(){
  var BUILD='23.9';
  var RAILWAY='https://diggerz-multiplayer-test-production.up.railway.app';
  var HAT_ID=395;
  var HAT_SRC='data:image/webp;base64,UklGRmI/AABXRUJQVlA4TFY/AAAv10ASEFUDhLaRBElJ+LPu7rm7fwIRMQH8Zfnrnpt/whMbhgJ6uOL60IaWa2kG7mW2uChN7B3TUdooKxVQcakSh7B44ZUKqIcCVW6Eh4fW0AQcLGZDgqupUAaWQmHDVAMzlKWSDByqCeZFlQ7RTdiQPCF5AdA3wMUsrcMXFXN9E7QcsZAAOdIapXppDyppAeYMOtFS1NRyUGrpok1xkyrATiuxsgnSLmAJV6cbl4BDdnlWRVYBeVb5z1bs/1u2W/k978EZgNOhuoyDRmIiTITJMKl9SPo8133dz37P5s0/XIfAAE7UARA1bovogw7BXUbg7nAUd3d3vYaBu+sdsXgiDtGe/KYdcYgsEpFI1AG4RI07Prg7kUi6sQsn7iFgicyNy064Zb+RAZyIjcCJLgM4T9v9JXm619rxiSQWQ9Dkf2QI7mSSN3eiS7wHcCLxDIB1pRPPWjfu7pCcdCK7X7jtAaBVk4G0bdL71/wpbNu2YTr/v1iSAAAsI+m0tm3btm3btvGzbdu2bdu2vee7tBBt24ranKcZgNg3gUj1BzDf/39a1pzvPlVP42Hbtm3btm3btm3btm1bj23c0i3dVavPObf9B5yYzXHsNHdsc+QdWyd2DeLk9lon2HEyasdJu/vGObGdVNCexcmObd8n2DErtio2dpxUnMZIZ63sPyC27VnFMye3B7FdsXFja8duxD7BXT3i6AR7GDs1OLGxo8YzjX2Ckd2KzRNbJ2vZyR63O/ZZKxVbFdyKk5lxYhs7qFnspDmMs1vPOPbQv3j2rLVj11pdcVqVtSpOhvZdK/ZvULHVOLfXKgNp26T3r/mD2LaNIIlK5u6+/4I/nmjbNm3b2rbYsW3btm3b54SMa9sI2bZt27Zta6095+i5DAaOJCVqHE4XlxdgvwCAvGQ3d+6zjdh8tq3g2X5veId35s6sPbNvbRtvx1gO3pqztvnW3n1czuK8k9lJ+kfYVpza7a1tW5sUn2zFyafinWx7OiljZ2vbtjlBzVe3t7Yd3to2t1b0q21bt+bUtq2pGb6eh7M199VuY5u35jv9ZM37UDfGBNuUn+ypNfnwi/Gtdhvbxqdym9ptOLX1+1LHn+rNO3EmdaMaf8Hrmbp958T4BbWNber26cuvtm2FtzamVuxk38nZ00wdO6ndvn66p9laU7fzzukiaNs27vlT/gIxANu2DQFwAEr/P7eWHNu2aiuhego/Av8fkiADQnCnR5+Wu+vdYx4Gbhspyh4zDWxvX8COTsBn8AV8Bd+8qCoAUuBk4A7g+cBHQQHgoLCjFzHeUBGACTiBPggD9WC1xKOOOYA5kFkDMHgGfGI78rY2kB0CKIA88AZFyDRyXQpc1GpZBAAmYMmBnxGopum+tJIOrU51GCAE0sAHVIH1Et+V5HhlCv6k9UnyvyHUSuo6Oox620BgsTt6iqqv7dDqSgL7AzcBLwS+BPy9kOFaTlU5YNRjp9noCPpIw6bypzCKoRgM3SAJZsL9fraUavq+6kVg7T8HQqNSOqo6gDwIuB14NfADgiGbzZCZBJYSp0MD0HJ0tQyYRkvVKWxQBW6Kinwy2I06MoAI1gC7h6SCBHoDQATUQAl48NyAnxWJwC6Qo+2A6gAK4AGeoA4cxZpZc0iqBIx6U8uoGzRoGhsFk9G1URRehVOEskQVplxj2FY9wQn7oauw3pJfB6xABXjMAfT1L/EjC8hslpU0AvcAX4bzjyJipccYbxX/ALRBwP3i4LgEVNTaAr9SUrnaoXHoEPWTRq1qIqNrI8kenrKjUjQVoJToZAkvkRhra2SexogqA7fQq/oqSQ/QQWD/En+HETwxwbVam+CorkpcXTBJAPgdAWP6cMvaDeu9N4G2PcjAt4zHfXXgrZBfC0ZpElkmmkldoEHRuJXNcG1kiqD4bIvNdujrzvxAh45CBPIjlJKq5HzCTQIbLRFVAx5HHwwCoAROwAeB37AsDCJIOsJkAVMLaAt6jmGjOrRM1AACXqYO1PpcsqZ9SjQeHPfF9wR4pA1obXxFjLFW2jUDhRa4dkmQnwmaWVZUiSwHzaf9HTJVQoZrU+LjI10WW1Sy2UqVilaHXuqKZwYUhpASCkTJHSkKWWvfomrAK+iVEkAG7EBHSW+ZWdBlGcBUvFKRT63KYGcCmCnQx5eKMcN0eYvTgB83KCEdhIaU9imZC3AE0XMAlcsHE8g6ODnjYZ8N8gB6teqK4l/THn0IIIAW9l1na0irE1pA3aKhUeVkSItS8V6j4lHKZkuJrmzZ9p7OdQuEUGglUnJHRaFr3TQkDfiECAlwgdHLkeesFqcSqSg8TnCN2oxSCUG2PRwp/fURRwACcAUaW2MruQQclg+2wAjQpe3+EsAOQsD0K4parVa0NXAcRdHBo7XOs9LqYiBt0TsEJSB1m1sFFkADSABuQA+IAdaoGn91R4DUMcHz0RGwqpJb3SLqDg2TqlCGtMjK7rXYoiqbzRAfa8s0inFuWEGJXoUqSu4Yo1B1fbE4Gfgp5dOgHNyoJVMFdIVGkEaAgcNXTcjx3GixEgKrj7aMfqs+or7ruZUKpQRQbehUIf+WzYVY9tM01RHUD9j3kf6aYNLMDlVVVUniuLmXwSB1rBGAb26UcjHg3+xszQYha/8u64hgleAfBH8450/966neMvAC4GnAg/aj+swzorQrAzI2h5SlyFTFVRlVY7t3kZk24+caPBEpf6KQS5KmKCJEuZdHUTLGrgquE00GQkSpt8BewMdYTZYkpRHoIt52mzBmGAYXQKREI7LcKE9STAqSr4qDKo8QHeBtBZXc4x8LdCEfsllQJe7+WdCqIJUeqnRQ/VgG7DaTv4YsZbND4gLQHHQZPUZfaKA0VIwYYxzloVLq6FAC3ULY5fF5Ixb4vyQVJGXSwbKCrO20QbwsaGpUOaAJud2JxldeQGiBdA0kx0aQkr/yLjLaZSxGW6mUlFjLySRQCCEqUYQS3ZQYkoatGn8scMoTdZpqNOrHClhJIhuMztEIKcFQ/b25N2qNaIoOl9VJB5ekSvLBhKhyIy4NgL4QWM+ULgSqi0Ze1FxqJLqDbuxIvz6UQkrIpFeZRFgCA9AO/Ec2O1RJF82hXtNYCRsrBmPc9VAIFj9cK0AAC7/OdRb9kB5hDduHNqKFaCqmUz/UhVHHGUU4TuIkVVUnHY1CX1VPIlBGps5Y4uWjIB1gSovAMAP/LDgJj/KplMyCYvS2xZsgImR0bzOgQEjlSfZSW4lMBdT5I52qwGhf7Pv4203DoiDCGHuzbbbo4nIlWXPDJFjoiWJCij6xID86Fx2rtwrwwQurZZoFgXYURWk6QmPQVRopUcwgFk4Dy0oQAQHwvSwIB05AbRCgAdg2YL8lSIhiQeWUplFPaUyVoUUJV/Hx8V7vH80nOxv3EqWhjb/RQDAvk4PwwsYqUgWjWlRIbzQqGo4aQjVAurYeUNfQXJBt/AEw0KOpYpdH1qMoiqOL0xPwPhH+NX+op+MwwiXFUJVTUmxJ4QiLUDKSIYWM7koSEQUrjxdHpSqVD52NDvclYVuIutIASlGat7LkETVhHJ+dmblIa66Pp2mfi1nss1esRublqmX2DHvB2EPbYzHrMkJk4LGmkunApx23i+/yipE+flVejG0Td5AA0BY9rRwf7Ef/btY0mWCF4M8rAD7zTscEPBy4dX6m9DUnOZVsotN9Gg1hjDNVcy291x3muLzLs2R7I8ofz4ZQ4UgKmP6YcN/LmZcaW6YmsOx1iv+sbEssHl9qqtMhdQzgX8CeVYyBnicn3AyslMYok8FJLLA/CYiQZ+JA3IKoKBRqDOxD6lXnk2PickOZkq0kWTmKJEMUEkXxo4GnpSRZtRO/RU2rig98pey08VxivAfTw5Fx5XzXVQtQSgv68KcIkEDki1Kv+q1MeZINkgwUU66kfYVA0I2KfNSct/gYe0Hfi6EXptDAFhrG+lNVDcwWTQusv22FSHsjggIDKTWSJeFzgvPFECAQpEQTGKoogGUFzWw2C9+6oSbgmkLv08AYGWwxhGPjsw0FTm6QYkBSJGW5Ea++e8GNug1SW4+LIF64SyNsgjNtl2az2aKSZZHZc5qT126Pp/DoqA4IYCnsgA9tI2wMlrn+oEo03FFl4PE0ZpcQYBfEQMHQeuf+49wk3Tkp3k9aH2or7/Iu3TYQkeZ40z9oM/5rHAqYctzFXTBcMJc4L3GVOARnwXphq2CI0pG3Io6CaBFQ5pshLVubkPaVJpXwpBHDYcdUwXZxhXQ9Y2QtsIKzxJ5xFLh7ePo5rqobwBPBhnC2D8eSImuNj+XKbrG5tiAxcl5Dr4b47L3R8PWlgLTN6BJOoFmuBqPOO4G7YVQ5N5LlgC2BS3UkNR+MzR5/MrnWpIHmWFoz/hEIhC3OoqjLOvumFcmOmVuKn02DC1+RaMgm+Sll9aLCZbMttlRsbEqKLSUlNiUe95uAAlks8zahbQyB0BOBUTYqAn5pzrxbDUvQrQNyg5jY/jWKek9K6aNCIKjHAyGIh5oTJxHIdDNOOUYx1CH1KIJRztsM9TBdwpSwJb2ZzKotQ/0Y7Ie5qMnpPIJp1H99+OuFSTASEeWmZE2xMkHXJusdgwVT0WBBVzD34riEzXFI7BK7F9bTFnc/GnVkZRlFIRo1U482SQNsAvyaJQXRpn+Rkiu6mmZkZBRI8lVDvNNE9ARttfSgMcYJVatx0cho8NRX6jY66tyaKjwUcIEmtQgu/rJ4X1Jq1RINhSFBkG/i0XBbk2jFBblhidockmIjDXutMkTxPxZcHJBO/EbPvkjvjJzOsMrnO/vc3Iiw/pHL4rJ48aMqAVlGQIsm7DsI+5faPCw2ZSy0AIJpmUCRfK0OUguIjoKjsCRH2leaUCIALzWXLQvZ/hxc3fdjMUusvEHSVYlLmoiKISo8JmyZzrHkmEqsYgEzmRWuGNaUabM+dCEpAAAInpgTRiu7ckY9TemLQskdDxjqqa8HU/RtqENlL3GUtHC9DHjxlOiLajul1IoM8CBIJE4AxMUcDvA7VscQmwyxpzPyWbxnP6fBW3XUYG98eLYIKmpp92FxW7CxSkiVgxD0KpTauQlNagUYmv7hEJqFM94fhnsM9PAUuJ6t5+oH9x9j9+NNG3ejJpUgZtX+KJdOZxGspAR3GnjWxswnWHy5tUnLVtSd05zmdJm6irQ1ZZGZ+9RYIuOAv9ZmsiFfdsAsda9ge8qUVe3bJHCW1WbI9YZAoYikyU7HeA9bwVhi7MV8L5YeZdyZhPWpcr6SrirPAFwKn2FL1ZnNjfEKn3QB3eUuXfzFs/XU3inX6Gj0jJJKxnEEGgn3e5YcaCuoFpZoU25GtXFIqGWgeG2OHtwFTw9PL45edGdt3Ldm7lV/q/aMel6PsrikB1C7Rgr/7VDYZ5RAY4+EtGnK+SXVN4bhKYsBtOs9EiAS5NfyNWQSosliiaSTyd5hEEq8VUWEQCh1dGaa2jowdGpUCqQzfj/1Z3W1amtV36rGqqZRRaPKRgMtyVr5xjf/DiKl8vFYE2LlknSUCHwm/omT9/nuTlddRYF1EJRyWJNSoimiwqOn0ncFsBSAz12Fto01ATvcp47I4QlGuC9EBqSxX0ygIHD1xWgaEYFUDXPBUihjC1yJO7cyDYYeax0Zo7Vcmi5ZvcvTNDCVa6DEfqbX1sX3a4zVdUquFYHwIEr9Y2VZ2OWFgKx/OIEboBUsCU20SVkzNaESYLZyrAVtp6ZOxa0SkuJQfmr0FdURZzG4BvXAGBApM+VfJdzf2I1yOzmj1rTpLHpGNWC4nq1W4jWWAfG1vMPCZJ2qrVSKjRAhctHy0KohQiCUujxqTW0bmJxrcI3dyVlXgD6MBxEQhksAlct8UGh1M585DNFOLRGMVr4eLhf50gJEvoz8zjVYzYzlLHXZcOw5LiyxhmTDa81fci3jq1hcNpfNG0N9J0cgSxZ4Mr32+5PKUv1KPsQ8eUwlVDakeP8EbASTow6M4RoRkMlCmavgPFuABra0rH7hLsQbktYlXqo8zr1LCtUPcF1sHve96HPVNHWBWiyAgESIfP/PAzwGOLpFHhX4jcD11wqmhSTq70JJr3vnAlk1Wt4AxiN4oiALRcAaSANqAEczcSP4J1t7DUkUlESMtBFCX1KDvGA9wMVAmACJIKjiPPqPbBZvQuqVJX6cZKveBISWBzzIrLYHzDVcQ1J/HBclIZTSQpsQBK0hbwUeHHAwUYoqPjRhh6MGK7UAVwPmEQjZEcq98wYumM8YMrriJRku6O/ZVfqL7h7uelS4wUyzlGVOuB2k7BL7QF0bY5rbzUntJcYZBp5pJ6QNrpUA4+MEYAzGkGpgin4ZvDB0P/3aH0xWd6eyVj0NLw23VpDkBORJ3M1k918zm5XT6ASWtwoAYTJERq0+3ANKHQK7m0wmtgxAAX4lcP2xgidjfwMKhXRgp95w1vUEbgGCyKjh69cBLwZuBfZSjAokJLAbwb/Z0jVkSBASAWkjEeWnGuSlHo8TXkHP/ou8VWCyZuTkeaRy2i4tDw5zAqJXC6VuAk8yqx0AE4ycpIW5PCs/wW8OnIEOULVeG/kJ/v6DCUqFKWl8/BCBDl8Npei3ANeCApAgsfAKbU7q2I1dDN5A0dbgsdlQNYY6VNYznpLLrsz7YCu1yJTqqSFExt0MsG36VQTrAebYxQgDIhwKPpUZOpTLU37KBHz5krgeWTYL1owue4GKra6kio8NUglesTfDneFXy6wgbmpe6ozNNRRFkYmaBeBHrzsQEKpXsCIEyD9PBhyisW/6G+w5aQ77cCwusto1/Bq+H7jrFXbeZDJNJ3CtprDm98mWpeGRBCYR0Fd59DzlaLYaBkk+RT3AdJgFp83FYnk6S0+GB3Rp/YCBGgCh1K07M0udBJN6DdkREP+daiKkLTCIIk/RT7Bc8piAPTxl1pvdcMuWcQzwdOH6UcAoWCw8eagaShssSRe1y62HjbFPG8xzwdXD3sNyYZrjlc6oGf9mWcrmxSN1lUa7JAAfSy8pgXegEtcnAyi/wjRNz5JvFFT5akxz86v1NjpDCoN5ERBBUGpTQys0oLOgEc2DyYcpPcVVSO0rHLHr1BVF/MC3DuM+zttEGm/VcAAkmr4XbQL2ydiDxtKnpyhO3LPhnDVYA6FVNJlMwD7nDnwc+At4XP5DNdsbEvyfLUfDM3qpSODAaITy4yn/5Tok+Y31AM0sbQLsTpovHFqhVvwnLh33rUdBqY2MUs9mYJa6UJigyMmOggSymhIkG9OeA/jtVLjWgEGFM+Yw6yA1545Tq2ggDyv6jeCY1UM9ZXRSN4BheMAdR6VoVVh1dzFl2MJcia9kr0gKZmS32by4N+R4GhZ4tMkHakDSMMD5LXBERfP8ETE9FfITgH8A678xazT4IEMQeSE0K3CxwI0mZfJsSgJldc45zUttQ7C1ypL8USaTaXwNKYSN3WwTsIdCJC+17ORVpDkM1G/NecasyedmR3wYwOeP8t/NbBSBSR9ke47SUefilbxUxMmBecJ2IeeFnt8MVRm4VQ+QyuoNQb7ioxFFJadeFYicxZ5Yb7wIcdTA28xc1wkHlcTs6Ig/q7sGHrykOjsPIYBlaTR6MDSiNFVm7KwjcKtTSB6DyC8JBSKdROopY0e0oFefQlSg9iz24EznLOdM9fjRmByfKyk7htrgUgLdUilonUcsWKrVP4QR8tA5lvJRJt5H2C7TqrECNBCUerW3e/qUrzXyhagVrEZwTcYkbWpi6A0qnNlj7YS7VrM3VG1vSgJrj+8JAP2AIMAOCaG91BxIirppVgJqDjNcDaYZQIZuN2s351AlctcLiMozbRXg8Ek76gbv5KVaO7Au53o2AcIkFQAkAx5smH6qEFmPUjVZQwJNU89LuXLctOy1fR+RRr0EPm3multwECVGUAzob5gMQN7AOS6zNJaAXlRMRPHxFCXDGh13RDolBfKYJX6S0MjqyXvKWIgRwNM9wUkLMlEzSzpqrLOZ481ZKCWCMitqLzaqpFSdGlhxvx4L8ERIyyu8j7/IyAnTyCvno313hMfgAt28AoBAIAac3jwXgEmS8yfcP9nL649ne9w3JYR+q9M5R0mhakyR6rTRI2mQt9OErVf8LwTYRmsMTJICEk9bN32fjFh5V6ZblFSlfNSUo/BWZMGj8iEgil4FOIpgcszdFwmkzTFTZ5kmlQPuP1KA0DLAnpN2HFmFVLMnbJebQhmuhd+SsJw3FQ5QatGor8DPzGQvgIMIeXfib7gacBwrlOYmpSPCeDPtWWLTQ60csENHzCkPyWOd+GyECx40J+spYyNWAD7AHNf8SYFnbwrwJ9lf1JhZznzOmCRdR1Ak5Ve2OeERU2DSsRCUP+UJXGS1kZR/ik458ynfZL8ISnITRuAoOqZl/lICl2ItA9D0fUefPF5Nrm2xxzJ2KkVJVI24OuaDC9jNwPcsQxCUeg4BNlAoctuXmYf3WZlEEa8Fw8qttRZ9QziFQEhFZrAD6sUyRFSA4/xKfSCLbjvS6LdcmVONmFQL0qlMLdPOE/yb3aixAXsoSkzMMJ+GXaI2gaZ5wQu5/xNXel/h1FDYEygHYrQDEzsBbuhYKh0DExnZ8/F5+Gb8O6RNtpdJ3KksgtHK29+n91rE4EFz+KeMPeEEoM5/GTXwwD/j4NqbrJUepaFcnFGud+F9Ni/ukYubCtjxFFqCLrPUScLUKeB+7FOpLSuZymV6j0nSQCdbwWU1Ab4jcz33+LTEbVExuVVdSkUmn6Zu7RspAP8A+KHX+pOHAGsolBaQzEndGl0y50QNA1U34FgZIqogjAkqOcJpM/4PTvTKkv7OJdD4iImkPN6N3vYc5Ul6nmqkpGaAFCChzOEQ/IUlGKME9rgLUyEqQ8jElSXSJNrWQ1hJCQilrwoXp7/kaATu8LamG+goSk/BJNWay9Mx/rMGRZa7tshEIXynmgjWPwZB4q0WBRiIi3gAqDPHqzjvkudtAp4jIB2DzOUOdiXirbS+FHk+IYLwUG2bLYAfy6YVbvfsMjlEhT3O6kxN3abWBS3aWgofZqFK0TrgCGa48BpkqeuWn4ZE45NS+VJZ93Pp/b6VHkra90Nnfyj1CAIsT8YXMLk7ks8VrVLOh6pAuQgv2bVzfOyDp2JAHgOfwNdXKKQ0EKNqHVi5cjedLnFNrUTW6kbINUAmW8qZaTjEFBOpwp4Ml/jIQjbXbSVi8hRV+kt6nLfgMmuoU6CP0mAMHUyuXOoTS9vXZ56RtexONNpaQC+rJDBckCKhDSMq2CZPXg1StdFtkbT70tLIHtOB4OtrWOH4crzfImOHlMPTtcZD/I1iABADeRrPgUuU6o6qCSdRCJJE/1NQinWDEFKqR/0BWcgHWjCGq9YBGRNZQ8IIGculsjtjs7ls65gCoqsF9OnDZrUy12srjBYg2YqnzfC5bLbIpjmFV17LH509T0fFODZcdaokIAR6A74HzpKB0eBy5adfrnE3ziXJVkRJ6BByDVBKTw6fcZfN/IAo6gmHbm2DfqAcpICBVnp43eteydxOaXWxXTV9mpVUg6ez02LrxdIzeE7xc0Z7qrQKAGgfuEjw7F6SzffqqcbovhhDQ1ANIZ2J7t9s0d5ZTJwOJTopHHLbKhUg2ZfpPZ+1PLUNgb1JfQj1EJTyKfolTZoYpTI9ADkV4K+rVFB19FyeDlIrkW3cYCAqewXRE0kVGOJOaQiB5h3KhWlSL6zx7XKTgIT4zUk61VM9VcvJOGmazsndUhcZp4Eng6e9qZ3lFGVyNt9zYOUadtczcXOKorFHYAGaaYRgppAGBGafRIryZPgk/pawJdWqMoLRKkeAowyKcCpNL9u9tSdhB5jhw6q0Pql91mizw3qJrRdPbvAbbKwf2qyzBA+sQa1jwJPmqRZjbJvej7rQqht7L2lKrCwB23YOBGbostox1+nDtURFcBVS1Rp11Eijm4ECJZVfBwcF1+8KF5NTYoJBwaNAK7AEYewVUNlEsBD0gg6AUtd1kKqic3Bj+E1l7KyQuE2VN3nodJ0g6GF9uxp6boQl/rQmwNMilMXXOk1fVmrx1FqQk6mhOgtbrYIrQAyU1Jz7KBkYjZRjWUs9zr1ON0qNm4DFx2kt91qT+gwmX0KiGKJajUgEWncu7dQUwS0QTpwyBDIEcjcJCITLcjKLCINsu1b1TdgeXKktw/2w5MoyPgWcN41vrUGti+A/Xjc2sNNUDVS19FwkDfQrOWjZIgSWQCwXfJnxe/wli/BQ1ljggQ4TLE5fBgjHI9QR4yFcnOCMwGiF2AJcA4muNgh3BFyg6/uB9URUdhdCygE+DQ+NV1UowaKE6iuPDm0N1AHjlBD+WpN6bITV5jFBdYTCkMWHRxQKQD9nedBgqgZbuh22cy5yJYaQLHBQ4HKZa4yMfbOjjMkTWqGJXaoxAhRgkjIL02Wapa9l8lEzaZ5KZWd3XdAm06pHg1uApIMyDGJSab73Kmc/EsLEh2OnxXbGXHBmsxr8kDlKFTWVLpwk5GB/yAin2KxHEg/YPVSNkWhkGYA6YFDBCHA6O2+dcHYsFk47L2dHyP4G0lZDNXz8doAhJuBJmtq8UoAiJRhMaw0lgHZ83v4PDTqW2idDYNWS34fYzcD19CoXJUvP57UhZXhuOgoKGa3Dhri8WUYMgIycjKrfLD9Mk7pv/c+NJh6kyxmWNZImQXR0LbvtuuGoZanLdI7njPmC/h5c5rSrJgqUD9Y4AbgmwM1c42SNAbRtVA1JoojepdHEXAJkhyFLmoDXmNVuBrOarlsDrd5NqFHCb1uclIPR4K/fPr8yAtKT9S7LTuuTemU+tjp9Yyn1CVvgip977YqsQgBKjSSzezgIeGZ5heCLVxhv6Hc81DcnRtZAt0Nr2kNZKpM4Zz6SOOhuEt32xqFHd1IrWHnlrgEnS66emesNYqhY0umVLaQAeSbw25sjjUeEdqit38VpTyhWbbLrAteAIm1s8sD3pgQy8t5Ns1Ybn0Is8XNCWj3AhzSpexvhkmYTV6Xw1encT5cmW6Pv6W4DRYOXaEsMJcYSYw9rtvWsPSb64d6h6RsB+PUWGAn/zGSuiRIabXZUSAGkEViLgKy0dj0XZjpQs9oZMNvukqTbQOseFQm0Lc6Dg6vBaAWKX9lLJjVR1FQPS+y2mM5mOJNeGigZ7sEUFdYKBgACCe+1w+ncYJH/XyC0woQgf0LUNycGNgGgs1eK6pxJpEmLdVfbiwSQHSFq2JIN0UanQZqdmcABu+8PYKw7DiKmjxvKAuJ0+X8A05IXUCLZOE3CsMl/eUCXplEAjhTIuuI1PZqkmxIM3U2y0Y2RFFhz2vq77vynTdENeK8mddvouW8toSqTS1xXq2tsKBsjW4ctU9bjEm3hetgLuqzaTsnJQJQvNOYzdZm5ppSw0WY/6GMZETWZMD4GJ0ct81Sa2n4wh+RW33Ryq6IH1yhkjcxUA9b3K8qowRwSQllJDjoN9ijr8RSGeui7ytQtFgAh8s8DdwNrmxZmQVqR14yCaF6jo0kwYAcoMCE1oCvrVwpekdQee28SUGEqvXTNvVXBKM9AgmyXrDYB1mnmHHlLFkVRWEVRYHGKeqLRaPYwak4UVYHdCFYdtRd+k9c697ZYUITLY8R8QmPCnVdCMuCkb2gIvFtTu2H0vP2E4LGcc12zno8TNry+TVn5c2puVWbqaqpolA8MgKDUH7ag3akVzVZqRvmf44gG0l0bnXzl85xqeBb4HbCxHhBSqG0ZTA6iKCS3KsaIv21xe2LJ2DbYr8SNBUwqQumTrHiwHLMN5uiprdOVZMkG32DgBTBZORWC0iJvEAVZ85Y8T4lkdKGJkQMAoFcLTAdfgExcr5+s3PkV6+lW77J71v1AvUT69wcztITdAMM/6Kbf1n69fQOcxjrNRqujA+gyRiiuDWIGSoougwMOSDdazN/bs6MRHGm+DHe2KNhEPcho5hcJk+hUGiEZSA4DeIumdmXpebMJBilWVVB5S4fs6SszOk0OKl819TSvR3H2w6GATO1Jv6erWbqqCGSz20ipJIqIVo8eCZBRsIT7G7C1HuBaqC0DQ2dQhdGlxoYEm4QNN5bNRt6KPEseJww87bLdGaIte52ORzBMysJ7PRmgk0ZoCFqKlAOthzetcbA5yP3NiYFDAEBgTrvO0DQ5lrFZCUnPnp0T8pN6PxMGJ88T2BXy3zRyRIRpmi8fFeCzclwMw2DM8+FSrOE0aflATUaMuvK4bk2TNdw3wsUm6hFF92+34ht166pTA4vy+qqed9LULhg9bz8e0D5VM+lSCU9+SaCzDShFYeUK/ACLIAPomcDQBjxQk1qA5gOiGIE2jRB9YDGIa7JdLMF/atMDzA+uHtNiebowFUoZd0LEEjVctxzVXkCe0lEemFNAKD3FvSHoOGu8AJxXNcu8MOAaYC3Si5K0YKhIr+SDfJBtd4YksVQi4HQkX80IAuKKvM1yNvq+a/XJqTIE0XXgQFsyS/DnE5W52VAFKIs+csP2y2Jd1gj4IksSXxz3lsiiPwvskG4Dk05Tmr+au6bgukhKFsXEnWqfjUFSbdxNQDa4RdECvElTO2v0/F3jBr/lmuXiyMRuR7BTVtCrFmh8P/uCShAIVAC14nX1C/BgTWqxRIqOIwbSzkFU8lfFQs/+AspRHqSegZnUWPicGWJhlHJVfCDaeC/XDVeNwgAcp9QZlcGVgxAlq6Qh3HqjogFAfnWTkU8VsJDVD+UqfJImh8RE8X4TAZcAgJB1S9XPHy/SLkt51lX7XM+k65BCETFL3KiHOAgmyP8WoHQK+EtpZ5I918lnhUrWLK1JSXm09ZXqsTPpQkYdniXoK8BfLAlQO+VAqY9JNN5E1PRss9g0kAj58VBaLbesqXsdLvGVvJyqS5qd+9CGPUekU2GA/DNKHTMgewM0qtHAozWpZTIea1TWNuoDbqQdC3kmhStKkZWdRcMA4Yx7ruIRTtgOpSchOHWxhrg14eIArAtlx6pCUi0oDBR1mYZQa8IdBQAZiLMR+CRc2G8JnB1tYL7JiYpIT8MAgJAtTwleeD5YVLSReRBVGB3SCMRanpv2DFZSi1OGCuymeSdJW4EGmHIlK784+ax8iblC7sS/8HRFKqe2Iq8P7cXX+DElIIQQhZI/0LfOSauwCvgfAxEaLY+pqZ0yttZnEhOlXHWqJDmV3Krbf3DRTlUE0UGpEwPAhkcMPOY4gT9DVoDv/BotCTxOkz6g3I2tXVs7EsXkzLfvQ+uIwgnAxSZPYLDEedcnVtdK6y9RTQTuV8wQs1ruDICLKhexbw8anBCiqK921yUanQUgNICemvUf4Pcs6SzxZzSrSyGqxpQQCQCgTWSnUcFyQbfreEYZsGlNDbKKhSmU9pXft8UacWqJ4BZGoezFmeMMms84+yaBp5q7hpvGTv72CKy18LzoWezY8bQESwG4lb7MbWZNtcCvzoPJu84jIvfykOjJ8NhT6jwAf5YYmC7o5q4dN8JHPrW9ydzp3Kmyx4Ect0Q71SeIzpvOAjh0RcDbYgtpZtbBAv9bOC2LaVJr5bPetJKGj6fyaDmfqzm5IsHlXd6OA7eNesR7PIKsHa56mjSPRNWMEi1R67066CqS58c36OwT9RyYZ+PSf6DEAIHuogXYluBf7DMKkwechyZKRjWWBEgQAG2CXQXD7xakessQY2BZKSKFvPGAjY6ljpNOAzUYrUxXWRdspzNQ6Gi1UYQpaHvoL/aI6V7ubF7P8twUNSncTnCBrnk2Ki8g+F95JeDZpXSeTJ9WAolGM4nxueuUj8pLECGcv6Z2dAmvvdDmZ3b/di7lqnt22lpmnTX8GlCr1++VppllUpXIJZ8gu2p6As/UpDYY+/6mn2Wlw4ozTzspSBz0ViE1FmxHtVc6ekK5PJ0hug+sww7u4dTdt5WJ4AUojUIwnB43omTyUhNuTLLMQF6m0GAJ7H6UjtIZ7rVmL5QSOoUkPSIIT175USt4Ag/TZVabg2ij2KFM6SjgukALmc1O613F1JTy6qMMhgzh5dEDDU7+Sxlb9M16x4VTkTGfZJGigimGRoI4nZuEceg9gV2W79nJSetkdNWphGQkIjFx3RvFJLtqpfICVNFoeV1N3foIie+kJVWX9HTaiQZPONvnn3feK9uvKRKn7FirnV7ujFba0lCnAupoymtSUlskSiJTc2s1DmaUlxtZplkADO43lQMyQEO3mwNqIg91WISjqyQnzRdbWriofw7uOG95aFURQylLVpow+LxEPSlWeTVG6LFVQYCcBwjRAhySptQFHolvLXCSNTmRHy+DW0gBOQeY6gvw2ptTOyhVNR5Qz82k8TUzK53nOj9cKy3tiJQduwNcAlGUJ/WKp4apHu4eAz2GelxYe7cD606hJD2TzmhqIYzmH758AZB2DnjRPOqkTFWqbUJiMuxATacaD0i3caY4eQPTRQuSUeQz2oAIxNfag2ZESEQH1qHL1glhamowSg1XjtN86p5ruFM1FYNTIpwBQL+lb7bXWJPaIbLWpV96IBIVtDUarsyoFLULj4NaDACntJleCcdnFqDIwmc452S/ZbZjsWOhYy07IngBStOQm4VEkaLq3bhzz60qkLyD0GAInCxw9ZEl3nVQ8gYhKVncoC8dogBDKOkCYFHEeALf1rg+SlWNpyzh3vP/zs5va89my1FWBlLi1lVpW8FeUURuniTh8GaVNso3MB1h5rz1V9GxXJrK2+BI0WWMsEYBCAQScb0YIJV40V1vxY2PSRbdvxOXaQgebRY0UgD+AmxK0QFSi/wxzfvStvEDE0U3Uj/RXXfRYTbyV8pS4aqGRJWR0ZmgBD8Nu41PgScN7GO6iqXJUlPFbZtwk2iTaNuNRDoRwxVdbDabHeOe4SL6UDC2Z+rPC4VFLcwS+bINt+jYymhtsH5RpTlIopMpNyWjj2SEXhrVIUQHpGsBLpGli23/5MaeyYP0DFXI2y5xA/Bsi+QVgBXC9YzDMKowilFuzQfddIvMVsceM9aZrp/YKeoYOGGRdovo7DfyhOgbMFw8cOZ8nP2OVNOEzqzM6imq8Zh0BgrZImDb9StP03Vycj/xJBP1iKtPmu5pNS/WofW0it/4KIhu3XOGG3Bn7UfBMiYiis8zMf7O9ENGUVUKmm7ZvfPBG/Rpn9ZJoMDpnOJtFzluy01um0RsIxzRnvisWea6Ym227Fh85jgzu5QryZdHJ1WmLDuWO5bZ1G1kncXUlIoqLQBTC5omonzgXb+i11btBNEZU4PnfctqE+WLvWuh0G95kLumUrWsAcmWdL030gAZkINcTyWQ0QCs1sMniOi3NtRR56isda1DRREc51fqTK+E+UQkenYnCnBx1s1EaWPh+o0pOWnZ64qGHZLr2bPnPuF+gDwR+D6hKGtV/KT9nxj7ppNJNBroUFS9mfjb3kUSboJexwaL/BcRonWOPFFNDtuFeFIyJR6aOIGaBko5FFFFVtEl0xUVBY4Nmr50qxKkoN5cEviqruKqRJI2YdP0hazoSEWRd0YUS4EpNjM7huZki7Wc/ebw77LsNCvX2FDHqjMk21kn96X4IaOo0rKCNx1RbmR/wef1ajWYgDovp9EA3C+rzZRA2u+HIY/lCamorywxHCnCEvx1lYADgKcC3xU0DYbLA7HIWtrdnrSv8lZnntnossPxtY1Yn3DWVWlThb08EqlaXC/1PaVEcAtqHYWctZxZtjn3plxIdFPIXi1dxKRl4PEm3vHtEUqNfSKrXe/oTQ9qQJym5oRkdRJtpWEIdC56gCdqatukeVkSGWVGFJ8V5viw7Y+SbLGxNScl5fpy88FtQ8piSoBseCumzxSkAoFTo4/ihkjrdZOvkPg83hmuLLG2RcbaIimB4ml1whfz5ixz/bOS2ckaaRlNqV8EF0Pu5SHvFJ/Xs8WagOjVuq+Wt9bUFklQzav2P6oexG9QieGVOMftQr5FMGmBbiYlsiMKkyqAKlqoBuVDka7Ntu6y3mbN5SRXJYVSKSlFlQFVmKLdIkUnfUPPVgbrK6kx1Qm4ntpuV1RqPp7liVS+CneXuBP/wntUJhEWoy/egVF4/Q5CepaneUjBKclOtQjRQakboXxb87LUtDIjMYN3ZmfGLrbmqJLt9c3SyT87n+rBcutYrg1kzYcDVEwHNgJ+9+tAfZqMdfkSDUHrf1KvPHsez2c5c6fpsvooikKP1LQiXbPCrDIrXe3ZFdhb/rQTBL7yCcBoC/CkkFtE3tk97+3wJCA0lKLhgTW1dRJc81qbljxiTVFiBBKnBLjMDmDBHVmbaBCU2BeVeoaesIRs7uvas9X2pxZa3zdvfb/yEpUSTkButyjyrq2Ly0+B9dG+gTuJOXU5stnpfPvJJLoR5bGUR2URwVIAbifBZAEaQcdxnVMUKYQQRVFyzUymxUyBEEo90DeBPF5T2yDNy+oijLRpnudzXbZF5m4OrVe1eE6hePFgOb0BCjUGlS4RqFd6SSHkwge4k2sv1vDQmBOfQ2fwebwvl+cplBDjv3HZHFvPYrtzyVY7GvY7bUky8AHgMYHMarvApIrLo5B3FNagfXgyjBsABFZJDVejqe0wQtS8aJFJxkRE1VT2cESyX34FGEVbQH2hCiqMqW8pN3R5CcnnOx6T5S6brq13kuuaBqNVcFF/6wlnU0h0I3u18vRYC9YH1HqlxmJq2OXAsuU8ye4khk1U4X3C7XdxgS7gOy2CpgLExAIlUxyhVyplsCjKB8bCpNv4NAD68nG18bseTW2NNP/kB3xgepxR4cqlJ5tD03TOPgVT3tXH+OdcraAl2drOPPtreYEUUIIPtIJSw1OTbBM0iTUJtHaEQD2kPdfUpJBIpKyaGdJ71lnsumjbTuvPZcmxncO29Ev8KwkGgs83qx0FU1x0UzczowBEzOqn+RpAhvy4pCl9fM5XOmo88t6Vv/ExyYh6nbjAF4Dhc+9BNSbCGGd7LTWXsqVcpa7uwtbX67LtstRWpvj9SlFH/yucgESxcPLulGs4zeoyAGivj8nqncacuBxZtluum1KpKOlFqljKSBFHZFrms5mAF2tI7Zh/3RS9Gk2ATAqbIiRUVz2CfSOfatRofH8XTqsBeLimrnBXP3dXDZb18nIr6mpqzulEbyYXNc2q5wmJJBpmM76z7fBoXZ+kHaeJhqASQkoEbmyCthXewx06caYWE9pzKrXVPLpJhijUe3Zi48tZ77LR1TM7nVMekp1cCQTMwAx/a1Y7CyaVosRha2+2uNFPGwY+56zu0ZQ+Ptc5umic33D2VGg8aCKi1m1vAgCc4qdPlMI48w2TbJY/elC7PQm0tHcwx9lwLdVJV3U6JU7xK+XQ0RtBJT7SqHscZhURBAJJgDHaNcxuuHIctlpfYgYKRVEeV/OhasBbTb8YMDNSNXZSnrTVJoTSDxsZLCo4DXvPrhdTAchP0I4jwAM1tRWyqw8/DmNGGXwEkg5Md04fNl7tpVGTqUbqLfU4G8xY0PXCFMw95rLNMauRwqasEo0AMbWBKJk3uWsSbrRssqDreW1c6bhcNe48NpZiFZU6If+pizbXtVTrHRuOTXbKtjqre2B9GrX9EGhLeQGpq2BqIg9K2AfCjqz96zqoodUQCf4ObFkwQuBzstRdY3enVJGxjojfnNQEII1CIFya3ZvrDBWadlprZghbcX7WuP1Z3UXv4gamOQIdf5sQQ9mbQ4coT86k5rN3drMugHSyAujIwPE4c32F3Y4bI3tWyu3eJzxghwygp1jGZPWtuh+jJzKNuBA17avuZg+LIYTs+zOyrgQIBBzpNQD3aWpLZfkPPzbLyV/WLHPu7l1abcZ/uRJATyxkM5tjL+h7zo65hC1xlbhyF85WstMR0MoQUgDOJq2g1H0IrGxM0nqv49Xgyk4GW2wXpoTpxVlY7AwwMCVm4i0sZVazreoW3zE8u8xFUQIC0Sow5/kes9p9MJFdOCqOqKXN7qCDHXBey18NkeB/43NtCviGzPXS+NjjqaSRGyLPvjm15tiHQz90RPlq3QKG+eGMEuMxXsqdYcfpXy+tuhxzNdfgOFWairJr2PPsfG7NDMMsyBIrHKDUkPcnH4jQaoOxdV/71K1Hpg6pWGLiHtpPuN6QhM3YdRmciVfDk27n+tqwLfC66qsYwhNFk9qmkXvupYoAQa/WQrQAd+pqVlsgY7ce/jdQzrOHR4x/hN2KEEnW2eoydA5zib4XS0lDjzOHlbJl+2iuHGdJ2Rl7Y0n+J2WtUCDc8mkdbLmzTAqWItvKuCScxF3izmGzL3xUTA9f0d43fdM39c9q5zuuduot8vgJ1rDjkKA5b98CLawQ/FKipucy1MNaor3g8GyHdIO/USiM2mXmEkDogR8V4vpkBNSO5PZJd0dSmfjEl0agfn3uJkD0ofl4SQQbp2yGcWd9YyzoLzAFX87mzrittRUFbl7YrUk7ilDiqKjUQ9J9g9Ye0K3xVo6z7u6HYLDAP7dLgkFZaoTpMZxaDlodDHTiE594K5kJNQPkEyAv/ikBKA7swO+7bNu+Bjx0XoY5R22+U3FHrVKpY5e+JW+pJw4UF7TBNf0BoYhsMh8CIU9MzA/l3GYyGwVdiSnHnsOWuHIfrYXNcUhZOHIa+2OgZKTHYD+G+mnqlqTDepEip/uFuoqrF4kxjLimSa+su93t08pmpaeHExYyC8w8ZzE39fbsZcurs1Y4IAlWWeDj1hP06ID2lWhJvb0GTF9iKlhLix+jqZxkk2hjtPgYCNEEAOhfKHD9Mr64pUSAQCCoNAVig7DYtMVtTm6ydMdQjr2EKZ1dZqYSi6Q8Kz1OccvPaoFz1FVHHX4NDwe87+a4mhRq01C7Nh1TZ9wFc8FwD/0F3YWDouP74OQNFEMgDYlgOLqxT7/91Ht3k/asvXwuax2LHeHWz+Jl4Ce3TjCpzW2wPgxTxSjYsx/C5Brs1UCvxQ9Ppi4G1Jr7jiEDgMC2ZgnCaKoxbQPG/sU7EhK5rVltcWa0pf/fxEFhc5PmKMlvyy41lwXnZbj0c4OvL6us0TlSICCB1WUCj1IUBJ5UiGBRPDDcacugHx7Rp2ycOU5JiyPTmjRnyWxmITOfM99lNWdHsLU6jWBEZp8H2EEMr6IDulxZ9Odw5dhLbNJ2sUps2Sjsd11DJwBQauBPawAEkL+xOsaALVniLQlNxn7Hzl1WciZy2ZhLDL3egvHSJr7IaD+6u5u3eV+qt/jFY8XgZ2KkZEvMCwUbGXjNPDVSQEW9v/p7MWWYi1XNZH9Ohr2YSCu2VBl4Lb0l8ElZaqzp3o7Xfmdw9AW9h0HsB5NgLvr6doofuJfgj/IJXB8xBQtjzb3dB+wzW2lwn1NPD0NPQ5mzrIEGAPUHiDrWmaVTN2A+vslR0Rb197wki5gJlhvqoPZ5n6+pOY0+GSgZLF0Vg1Stq+Ta2g4ERPAs+1s7rwyktZ2gBBQAxlOhUbvDmvH0LMRAcRezyqI1Wl5mvmMhZztnrK30BAaVyNdxmkYdCZiFAAfAREGXjWKMo2DJMWdvN/keijS6DMAseHe8JaAg+C9bOmMwG/6Q69qq1pGhxNiLuRdbrrmP5ir1aWVZssi/Omyvj872pfujlw1XGL7nyKqu4fVR6uMn+cm6ommVpGnZfVrZyrS0VsZ1abQ2z1ZDlYEH0xtuBkswQTHcWPRRHdHit36peku9JuOl8jRutqv4/Y+It5/YvDOIyU/+RR56FBgJk03+tRl7vmkzO4kh0IW0PwMGWToNA47SdE65hxzcpAfVt76t6of2mcOLu5fhXgZ7/V0trTKNhzhIBc1maGCRz/mPf7Wgng+kRnE9T4FRljTE+v06WswdnGdSBjx6JntssV7szyrUAVyJv/EIIOuhpCUFrD0iYLDBdY/G/pwl7oKzB9vPGeB6sBdWi79EhuxWA2AZI3zB7onPxGgPS9bdL+1ud7nOrSyb1qRHe02jHe1os2h9dLaPzsYjGe3FnlXZKAqQBCss8BzgpTutdgTBU7TnjqiHRzTU0c5kAQvg6OHL6j4kwXBExtqjZWlJYyJtFjqrYhfKS+UWBoShHhM9NXf0fcM60wwLb9wwcc+qFqCnNasFDFWZtUeZrcdQfzqzX3F+DnBqMAQuT5MaIGbu4fTcxd8ps0msRQ/ZBIfnEXC9XqSOropNnSVlCGl8gAk8g14QBATGpZpTYhsgFlzEWcZyhuMDnSLlWWtlYmYu6rTqJqQqR1f5gLIwKTRbnDdQmlZFqyKj/EZZRhm10oxSk5JJCaTLpPNJHpT6GwOHAIZAkIwvVlnGV1zbrEY7aa1sWlqTlme06Sa0Jp2F28tIrxepuFEowCNp7G8BexLu13Igo2+WmR96Uz7Lcbf1xhtsoOfIjPaHKwt0wwFZBXalpSHQikr5N2/eps3UMuJluB8uD2O21n/rJBkw4RYk8F3gq1cNVF6rt6g9+4w6Or9ae6c2p1an1k4trLbO3GizRlvSr1+DbtS3fA6WyKSUrfF6WBmjYBFL3eANVq6LVd7oAlVogAcRUpCFFKyC9H6AmFR8FZQ7ApkDgw7gT8JdyDS+hUfkbaEYgFdl4b0GBDWzBG1ElPoNIt1WQBBEcj5o2WIDnBMCOgfcaTNhFR/Qw33eZ3Ypy6QnfUfspeaaU2bLjo89W0BbhnsYuiZQYACAEPlngecAWwH7pilloZ1+qm+tdKU1tFZavVODU2OrZmutv1pRg0sz2uWmNWBlCFgGOrfnrtpWSlIsykcNgIAwy37mShKnDqxN5QTZN6anbrvlZepYwDu/43fEzOrqbEuXkyLAQEAEIEJHIUB+e8ufucfAEwgS+jAQsNn/3cK3o1YvyWSIDANkAfgz8CD9UNCSCgI4PpjYJtSdyiOeeD9aBijf6lkCsFqwXWwwT+ksp3yWZ/kIj7A/enoLWMACNDRuE9tTT1aitrHpplCr10PcBJOpNuD/nCp1pwIA988ar5V4Doi2U79ggAcQkEiGyGMEfg48xnTreGLOnET5klPhkYgCuwPnrXdS+j3OUwDzBRVYXUaFA7yCdY9GXr/Pv6IjNjqe4au46VwCtwfd41cBdy8JHPw/Xu+FNkrtGo1wo7cFJaAIFIN8kAKi3r1q4AQsfwR0gTzA157G5rVMNa8RWw23GmY1bOPKDqTBRoOMBm7U36qvUW/rACdvgclZ4AFbX4k6G2+hY6T1LO6/6hcr/zoAuVEU6yU6HmBXo2XNx1hOYbMsPt5Hvn0swAaQaLjT8bYIDsARcgpOP99/8OCVr7z8u//+NuxOBMsr/MyxkZJKsrIsXMc1AE8EkntTAqs7btVVo/5xpxslfYgJVdyhrlPg+CfIbqRxzRif5YDjOEf2QzAPbMZX7tcTaQBv0DO0LKc//VrXevonPCPga18H6oAwbdA5F0am3eV4G+y37EDeCdlojPr1r3991EajMWpZDBnmKc9+kMVty7KwzsBHrmfXr9+40Btpr4dE9foFNDbGB8TotbI86m9dpvw2RM37JN/FXQiFhPGl5jKPgaI1oPqICE1v+BxfSW2oTVj0qtLd8ILubL0+6d2Myny6Pq0dH+q17fvcmOkkL2qyt3/Ut7+hwG0/g6/lEG7io44XaBwBKAHFXQdOPuJj03tCvBWdjB+ZqYf2elslTKoMxvgoHxPBynZHzrWf4nY48Ir1JljXQ28+TIwilrPJQg==';
  var runtimePatched=false, tradePatched=false, uiReady=false, adminUiReady=false;

  function addSupportUI(){
    if(uiReady||document.getElementById('diggerz-support239'))return;
    uiReady=true;
    var style=document.createElement('style');
    style.id='diggerz-23-9-support-style';
    style.textContent=
      '#diggerz-support239{display:none;position:fixed;inset:0;z-index:2147483000;background:rgba(0,0,0,.78);align-items:center;justify-content:center;font-family:Arial Black,Impact,Arial,sans-serif;color:#fff}'+
      '#diggerz-support239.open{display:flex}'+
      '#diggerz-support239 .panel{position:relative;width:min(920px,94vw);max-height:90vh;overflow:auto;background:#171717;border:5px solid #f0c22d;box-shadow:0 0 0 4px #111,0 15px 60px #000;padding:22px;display:grid;grid-template-columns:minmax(0,1.35fr) minmax(220px,.8fr);gap:22px}'+
      '#diggerz-support239 h1{font-size:clamp(34px,6vw,70px);line-height:.9;margin:0 0 18px;text-transform:uppercase;letter-spacing:1px;text-shadow:4px 4px 0 #000}'+
      '#diggerz-support239 p{font-family:Arial,sans-serif;font-weight:700;line-height:1.45;font-size:17px}'+
      '#diggerz-support239 .amount{font-size:46px;text-align:center;margin:12px 0;text-shadow:3px 3px 0 #000}'+
      '#diggerz-support239 input[type=range]{width:100%;accent-color:#f0c22d}'+
      '#diggerz-support239 button{font:900 22px Arial Black,Impact,sans-serif;text-transform:uppercase;border:4px solid #111;background:#f0c22d;color:#111;padding:11px 16px;cursor:pointer;box-shadow:0 5px 0 #8a6800}'+
      '#diggerz-support239 .close{position:absolute;right:10px;top:10px;background:#d94a38;color:#fff;font-size:18px;padding:7px 13px;box-shadow:none;z-index:2}'+
      '#diggerz-support239 .board{background:#0d0d0d;border:3px solid #555;padding:14px}'+
      '#diggerz-support239 .board h2{margin:0 0 10px;font-size:28px}'+
      '#diggerz-support239 ol{font-family:Arial,sans-serif;font-weight:800;padding-left:28px;margin:8px 0}'+
      '#diggerz-support239 li{padding:7px 0;border-bottom:1px solid #333}'+
      '#diggerz-support239 .fine{font:12px Arial,sans-serif;color:#bbb;margin-top:12px}'+
      '#diggerz-hat239-layer{position:fixed;inset:0;pointer-events:none;z-index:9999;overflow:hidden}'+
      '.diggerz-update-hat239{position:absolute;height:auto;transform:translate(-50%,-100%);transform-origin:50% 100%;filter:drop-shadow(0 2px 1px rgba(0,0,0,.45));image-rendering:pixelated}'+
      '@media(max-width:720px){#diggerz-support239 .panel{grid-template-columns:1fr;padding:16px}}';
    document.head.appendChild(style);

    var box=document.createElement('div');
    box.id='diggerz-support239';
    box.setAttribute('aria-hidden','true');
    box.innerHTML='<div class="panel"><button class="close" type="button">X</button>'+
      '<section><h1>SUPPORT DIGGERZ</h1>'+
      '<p>Diggerz multiplayer runs on paid servers. Support helps cover hosting and development so multiplayer can stay online. It also helps with college expenses. If you have some spare green stuff and feel generous, every dollar helps keep the project moving.</p>'+
      '<div class="amount" id="diggerz-support239-amount">$5</div>'+
      '<input id="diggerz-support239-slider" type="range" min="1" max="1000" value="5" step="1">'+
      '<div style="display:flex;justify-content:space-between;font:700 13px Arial,sans-serif"><span>$1</span><span>$1000</span></div>'+
      '<div style="margin-top:18px;text-align:center;display:flex;gap:12px;justify-content:center;flex-wrap:wrap"><button id="diggerz-support239-donate" type="button">Donate with Cash App</button><button id="diggerz-support239-kofi" type="button">Donate to Lime on Ko-fi</button></div>'+
      '<div class="fine">Cash App payments go to $Houstonswallet; use the selected amount shown above. Lime accepts support through Ko-fi at ko-fi.com/limeguy314. The supporter board only shows manually verified donations from either payment method.</div></section>'+
      '<aside class="board"><h2>TOP SUPPORTERS</h2><div id="diggerz-support239-total" style="font:900 22px Arial Black,Arial,sans-serif;margin-bottom:8px">Verified total: $0</div><ol id="diggerz-support239-list"><li>No verified donations yet.</li></ol></aside></div>';
    document.body.appendChild(box);

    var layer=document.createElement('div');
    layer.id='diggerz-hat239-layer';
    document.body.appendChild(layer);

    var slider=document.getElementById('diggerz-support239-slider');
    var amount=document.getElementById('diggerz-support239-amount');
    function updateAmount(){amount.textContent='$'+slider.value}
    slider.addEventListener('input',updateAmount);
    updateAmount();

    async function loadBoard(){
      var list=document.getElementById('diggerz-support239-list');
      var total=document.getElementById('diggerz-support239-total');
      try{
        var response=await fetch(RAILWAY+'/api/donations',{cache:'no-store'});
        var data=await response.json();
        var rows=Array.isArray(data.donations)?data.donations:[];
        total.textContent='Verified total: $'+Number(data.total||0).toFixed(2).replace(/\.00$/,'');
        list.innerHTML='';
        if(!rows.length){list.innerHTML='<li>No verified donations yet.</li>';return}
        rows.slice(0,20).forEach(function(d){
          var li=document.createElement('li');
          li.textContent=(d.name||'Anonymous')+' — $'+Number(d.amount||0).toFixed(2).replace(/\.00$/,'');
          list.appendChild(li);
        });
      }catch(error){list.innerHTML='<li>Leaderboard unavailable.</li>'}
    }

    window.DiggerzSupport239={
      open:function(){box.classList.add('open');box.setAttribute('aria-hidden','false');loadBoard()},
      close:function(){box.classList.remove('open');box.setAttribute('aria-hidden','true')}
    };
    box.querySelector('.close').onclick=window.DiggerzSupport239.close;
    box.addEventListener('click',function(e){if(e.target===box)window.DiggerzSupport239.close()});
    document.getElementById('diggerz-support239-donate').onclick=function(){
      var n=Math.max(1,Math.min(1000,parseInt(slider.value,10)||1));
      try{sessionStorage.setItem('diggerz.support239.selectedAmount',String(n))}catch(error){}
      window.open('https://cash.app/$Houstonswallet','_blank','noopener,noreferrer');
    };
    document.getElementById('diggerz-support239-kofi').onclick=function(){
      window.open('https://ko-fi.com/limeguy314/','_blank','noopener,noreferrer');
    };
  }

  function persistState(service){
    try{
      if(!service||!service.state||!window.localStorage||!window.DiggerzService)return false;
      localStorage.setItem(window.DiggerzService.STORAGE_KEY,JSON.stringify(service.state));
      service.dirty=false;
      return true;
    }catch(error){console.warn('[Diggerz 23.9] escrow save failed:',error);return false}
  }

  function patchRuntime(){
    if(runtimePatched)return true;
    if(!window.DiggerzService||!window.DiggerzRuntime)return false;
    var proto=window.DiggerzService.prototype;
    var rt=window.DiggerzRuntime;
    var h=rt.getH&&rt.getH(),f=rt.getF&&rt.getF(),K=rt.getK&&rt.getK();
    if(!h||!f||!K)return false;

    // Beta Gun is a normal/common mining weapon in 23.9.
    var groups=window.DiggerzService.WEAPON_GROUPS||[];
    var betaPresent=groups.some(function(g){return Array.isArray(g)&&g.indexOf(81)>=0});
    if(!betaPresent)groups.unshift([81]);
    // Build 23.3's active mining override draws normal weapons from
    // COMMON_REWARDS rather than WEAPON_GROUPS, so Beta must be present here too.
    var common=window.DiggerzService.COMMON_REWARDS||[];
    var betaCommon=common.some(function(item){return item&&item.category===2&&item.id===81});
    if(!betaCommon)common.push({category:2,id:81,count:1});

    // UPDATE Hat becomes a legitimate wearable catalog item.
    if(window.DiggerzService.ITEM_POOL&&window.DiggerzService.ITEM_POOL.indexOf(HAT_ID)<0)window.DiggerzService.ITEM_POOL.push(HAT_ID);
    var oldN7=h.n7;
    h.n7=function(a,b,c,d,e,g,p,w,k){
      var out=oldN7.apply(this,arguments);
      if(a===2&&c===HAT_ID){
        var obj=out||b;
        try{obj.Init(f.BLANK_PNG())}catch(error){}
        obj.a4=2;
        obj._1='UPDATE Hat';
        obj.c9=true;
        try{h.O27(obj,0,-34,1)}catch(error){}
        return obj;
      }
      return out;
    };

    // The recovered Beta Gun sent a huge legacy beam endpoint. Clamp only type 10.
    var old16=K._16;
    K._16=function(a,b,c,d,e,g){
      if((e|0)===10){
        var dx=c-a,dy=d-b,len=Math.sqrt(dx*dx+dy*dy);
        if(!isFinite(len)||len===0){c=a+160;d=b}
        else if(len>160){c=a+dx/len*160;d=b+dy/len*160}
      }
      return old16.call(this,a,b,c,d,e,g);
    };

    // Preserve type 10 for damage rules, but draw the stable ray-gun visual.
    if(typeof proto.echoProjectile==='function'){
      var oldEcho=proto.echoProjectile;
      proto.echoProjectile=function(a,b,c,d,type){
        return oldEcho.call(this,a,b,c,d,(type|0)===10?4:type);
      };
    }
    if(typeof proto.pvpEchoPeerAttack==='function'){
      var oldPeerEcho=proto.pvpEchoPeerAttack;
      proto.pvpEchoPeerAttack=function(message){
        if(message&&(message.attackType|0)===10){
          var copy={};
          for(var key in message)copy[key]=message[key];
          copy.attackType=4;
          return oldPeerEcho.call(this,copy);
        }
        return oldPeerEcho.call(this,message);
      };
    }

    runtimePatched=true;
    return true;
  }

  function patchTrade(){
    if(tradePatched||!window.DiggerzService)return tradePatched;
    var proto=window.DiggerzService.prototype;
    if(typeof proto.pvpTradeOffer!=='function'||typeof proto.pvpCancelTradeLocal!=='function'||typeof proto.pvpCompleteTrade!=='function')return false;

    var oldOffer=proto.pvpTradeOffer;
    proto.pvpTradeOffer=function(){
      // localSlots are escrow: save the inventory AFTER those items were removed,
      // BEFORE the multiplayer offer can complete. Reloading can no longer clone them.
      persistState(this);
      return oldOffer.apply(this,arguments);
    };

    var oldCancel=proto.pvpCancelTradeLocal;
    proto.pvpCancelTradeLocal=function(){
      var result=oldCancel.apply(this,arguments);
      persistState(this);
      return result;
    };

    var oldComplete=proto.pvpCompleteTrade;
    proto.pvpCompleteTrade=function(receive){
      var tr=this.pvpTrade;
      if(!tr)return;
      if(!this.pvpCompletedTrades)this.pvpCompletedTrades={};
      if(this.pvpCompletedTrades[tr.id])return;
      this.pvpCompletedTrades[tr.id]=true;
      return oldComplete.call(this,receive);
    };

    tradePatched=true;
    return true;
  }

  function addAdminDonationUI(){
    if(adminUiReady)return;
    var panel=document.getElementById('diggerz-admin-panel');
    var status=document.getElementById('diggerz-admin-status');
    if(!panel||!status)return;
    adminUiReady=true;
    var wrap=document.createElement('div');
    wrap.id='admin-donations239';
    wrap.innerHTML='<h3>Verified Donations</h3>'+
      '<label>Supporter Name</label><input id="admin-donation-name" type="text" maxlength="24" placeholder="Anonymous">'+
      '<label>Amount ($1-$1000)</label><input id="admin-donation-amount" type="number" min="1" max="1000" step="0.01" value="5">'+
      '<div class="row"><button id="admin-donation-add" type="button">Add Verified Donation</button><button id="admin-donation-refresh" type="button">Refresh Board</button></div>'+
      '<div id="admin-donation-list" style="margin-top:7px;display:grid;gap:5px"></div>';
    panel.insertBefore(wrap,status);

    function authHeaders(){
      var token=String(window.DiggerzAdminSessionToken||'');
      return {'Content-Type':'application/json','Authorization':'Bearer '+token};
    }
    async function refresh(){
      var list=document.getElementById('admin-donation-list');
      try{
        var r=await fetch(RAILWAY+'/api/admin/donations',{headers:authHeaders(),cache:'no-store'});
        var d=await r.json();
        if(!r.ok){list.textContent='Authenticate as admin first.';return}
        var rows=Array.isArray(d.donations)?d.donations:[];
        list.innerHTML='';
        if(!rows.length){list.textContent='No verified donations yet.';return}
        rows.slice(0,30).forEach(function(row){
          var btn=document.createElement('button');
          btn.type='button';
          btn.textContent=(row.name||'Anonymous')+' — $'+Number(row.amount||0).toFixed(2)+' (remove)';
          btn.onclick=async function(){
            if(!confirm('Remove this verified donation from the leaderboard?'))return;
            await fetch(RAILWAY+'/api/admin/donations',{method:'POST',headers:authHeaders(),body:JSON.stringify({action:'remove',id:row.id})});
            refresh();
          };
          list.appendChild(btn);
        });
      }catch(error){list.textContent='Donation board unavailable.'}
    }
    document.getElementById('admin-donation-refresh').onclick=refresh;
    document.getElementById('admin-donation-add').onclick=async function(){
      var name=document.getElementById('admin-donation-name').value.trim()||'Anonymous';
      var value=Number(document.getElementById('admin-donation-amount').value);
      if(!isFinite(value)||value<1||value>1000){status.textContent='Donation amount must be between $1 and $1000.';return}
      try{
        var r=await fetch(RAILWAY+'/api/admin/donations',{method:'POST',headers:authHeaders(),body:JSON.stringify({action:'add',name:name,amount:value})});
        var d=await r.json();
        status.textContent=r.ok?'Verified donation added.':('Donation entry failed: '+String(d.error||r.status));
        if(r.ok)refresh();
      }catch(error){status.textContent='Donation server unavailable.'}
    };
  }

  var hatNodes={};
  var HAT_RENDER_SRC=HAT_SRC;
  function prepareLowResHat(){
    var source=new Image();
    source.onload=function(){
      try{
        // Deliberately rasterize the modern UPDATE art to a tiny texture so it
        // matches Diggerz/Coaster Town's older low-resolution asset style.
        var lowW=64;
        var lowH=Math.max(1,Math.round(source.naturalHeight*lowW/source.naturalWidth));
        var canvas=document.createElement('canvas');
        canvas.width=lowW;
        canvas.height=lowH;
        var ctx=canvas.getContext('2d');
        ctx.imageSmoothingEnabled=false;
        ctx.drawImage(source,0,0,lowW,lowH);
        HAT_RENDER_SRC=canvas.toDataURL('image/png');
        for(var key in hatNodes)if(hatNodes[key])hatNodes[key].src=HAT_RENDER_SRC;
      }catch(error){}
    };
    source.src=HAT_SRC;
  }
  prepareLowResHat();
  function logicalHead(ent){
    try{
      var head=ent&&ent.i33&&ent.i33.f2?ent.i33.f2('head'):null;
      if(head&&isFinite(head.A7)&&isFinite(head.A8))return{x:head.A7,y:head.A8-8};
    }catch(error){}
    if(ent&&isFinite(ent.A7)&&isFinite(ent.A8))return{x:ent.A7,y:ent.A8-30};
    return null;
  }
  function canvasMetrics(){
    var c=document.querySelector('canvas');
    if(!c)return{x:0,y:0,sx:1,sy:1};
    var r=c.getBoundingClientRect();
    var logicalW=window.q&&isFinite(q.SCREENWIDTH)&&q.SCREENWIDTH>0?q.SCREENWIDTH:r.width;
    var logicalH=window.q&&isFinite(q.SCREENHEIGHT)&&q.SCREENHEIGHT>0?q.SCREENHEIGHT:r.height;
    // A7/A8 are game logical coordinates. Canvas width/height can be device-pixel
    // backing dimensions, so using them pushed the hat toward the left on HiDPI.
    // Match the game's uniform height-based scale and centered horizontal viewport.
    var scale=r.height/logicalH;
    var gameW=logicalW*scale;
    return{x:r.left+Math.max(0,(r.width-gameW)/2),y:r.top,sx:scale,sy:scale};
  }
  function showHat(key,ent,on){
    var layer=document.getElementById('diggerz-hat239-layer');
    if(!layer)return;
    var img=hatNodes[key];
    if(!on||!ent){if(img)img.style.display='none';return}
    var p=logicalHead(ent);
    if(!p){if(img)img.style.display='none';return}
    if(!img){
      img=document.createElement('img');
      img.className='diggerz-update-hat239';
      img.src=HAT_RENDER_SRC;
      img.alt='';
      layer.appendChild(img);
      hatNodes[key]=img;
    }
    var m=canvasMetrics();
    img.style.display='block';
    img.style.left=(m.x+p.x*m.sx)+'px';
    img.style.top=(m.y+(p.y-7)*m.sy)+'px';
    img.style.width=Math.max(74,118*m.sx)+'px';
  }
  function updateHats(){
    try{
      var svc=window.q&&q.diggerzService;
      var local=window.l&&l.z39;
      var seen={local:true};
      if(svc&&svc.state)showHat('local',local,!!(svc.state.appearance&&svc.state.appearance[1]===HAT_ID));
      var peers=svc&&svc.pvpPeers||{};
      for(var key in peers){
        var peer=peers[key];
        var ap=peer&&peer.info&&peer.info.appearance;
        var ent=svc&&svc.pvpEntityForPeer?svc.pvpEntityForPeer(peer):null;
        seen[key]=true;
        showHat(key,ent,!!(ap&&ap[1]===HAT_ID));
      }
      for(var n in hatNodes)if(n!=='local'&&!seen[n])hatNodes[n].style.display='none';
    }catch(error){}
    requestAnimationFrame(updateHats);
  }

  function boot(){
    addSupportUI();
    patchRuntime();
    patchTrade();
    addAdminDonationUI();
    if(!runtimePatched||!tradePatched||!adminUiReady)setTimeout(boot,250);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);
  else boot();
  requestAnimationFrame(updateHats);
  window.DiggerzBuild239={build:BUILD,hatId:HAT_ID};
})();